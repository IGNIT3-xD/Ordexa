import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { OrderStatus, OrderSubmissionStatus } from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";

export class SubmissionService {
    static async listSubmissions(businessId: string, status?: OrderSubmissionStatus, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [submissions, total] = await Promise.all([
            prisma.orderSubmission.findMany({
                where: { businessId, ...(status && { status }) },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.orderSubmission.count({
                where: { businessId, ...(status && { status }) },
            }),
        ]);

        return {
            data: submissions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    static async getSubmission(businessId: string, submissionId: string) {
        const submission = await prisma.orderSubmission.findFirst({
            where: { id: submissionId, businessId },
            include: { order: true },
        });

        if (!submission)
            throw new ApiError(404, "Submission not found");

        // Hydrate the items with current product/variant data for the review UI
        // (Even though the submission is a snapshot, the seller wants to see what they currently have)
        const items = submission.items as { variantId: string; quantity: number }[];
        const variantIds = items.map((i) => i.variantId);

        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: { select: { name: true, isDeleted: true } } },
        });

        const hydratedItems = items.map((item) => {
            const variant = variants.find((v: any) => v.id === item.variantId);
            return {
                ...item,
                productName: variant?.product.name || "Unknown Product (Deleted)",
                variantName: `${variant?.color || ""} / ${variant?.size || ""}`.trim(),
                currentPrice: variant?.price || 0,
                currentStock: variant?.stock || 0,
                isAvailable: variant && !variant.isDeleted && !variant.product.isDeleted,
            };
        });

        return { ...submission, hydratedItems };
    }

    static async rejectSubmission(businessId: string, submissionId: string, reason: string) {
        const submission = await prisma.orderSubmission.findFirst({
            where: { id: submissionId, businessId },
        });

        if (!submission)
            throw new ApiError(404, "Submission not found");

        if (submission.status !== OrderSubmissionStatus.PENDING)
            throw new ApiError(400, "Submission is already processed");

        return prisma.orderSubmission.update({
            where: { id: submissionId },
            data: { status: OrderSubmissionStatus.REJECTED, rejectionReason: reason },
        });
    }

    static async convertToOrder(businessId: string, submissionId: string) {
        const MAX_ATTEMPTS = 5;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return await prisma.$transaction(async (tx: any) => {
            // 1. Fetch submission
            const submission = await tx.orderSubmission.findFirst({
                where: { id: submissionId, businessId },
            });

            if (!submission)
                throw new ApiError(404, "Submission not found");

            if (submission.status === OrderSubmissionStatus.CONVERTED) {
                throw new ApiError(400, "Submission already converted");
            }

            if (submission.status === OrderSubmissionStatus.REJECTED) {
                throw new ApiError(400, "Cannot convert a rejected submission. Please set it back to PENDING first.");
            }

            // 2. Revalidate items against current database state
            const items = submission.items as { variantId: string; quantity: number }[];
            const variantIds = items.map((i) => i.variantId);

            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds }, businessId, isDeleted: false },
                include: { product: true },
            });

            if (variants.length !== variantIds.length) {
                throw new ApiError(400, "One or more items in this submission are no longer available");
            }

            // 3. Calculate totals and prepare OrderItems (Snapshotting)
            let totalAmount = 0;
            const orderItemsData = [];

            for (const item of items) {
                const variant = variants.find((v: any) => v.id === item.variantId);
                if (!variant || variant.product.isDeleted) {
                    throw new ApiError(400, `Product ${variant?.product.name} is archived or deleted`);
                }

                const lineTotal = Number(variant.price) * item.quantity;
                totalAmount += lineTotal;

                orderItemsData.push({
                    variantId: variant.id,
                    productName: variant.product.name,
                    variantName: `${variant.color || ""} / ${variant.size || ""}`.trim(),
                    unitPrice: variant.price,
                    quantity: item.quantity,
                    lineTotal: lineTotal,
                });
            }

            // 4. Generate a globally-unique human-readable Order Number
            const orderNumber = `ORD-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

            // 5. Create the Order and OrderItems
            const order = await tx.order.create({
                data: {
                    businessId,
                    submissionId: submission.id,
                    orderNumber,
                    customerName: submission.customerName,
                    customerPhone: submission.customerPhone,
                    deliveryAddress: submission.deliveryAddress,
                    totalAmount,
                    status: OrderStatus.PENDING_CONFIRMATION,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: { items: true },
            });

            // 6. Mark submission as CONVERTED
            await tx.orderSubmission.update({
                where: { id: submission.id },
                data: { status: OrderSubmissionStatus.CONVERTED },
            });

                    return order;
                });
            } catch (error) {
                // Retry only on unique-constraint collisions (order number).
                // A collision on submissionId will surface as "already converted"
                // on the next attempt because the other transaction committed.
                const isUniqueViolation =
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002";

                if (isUniqueViolation && attempt < MAX_ATTEMPTS) {
                    continue;
                }

                throw error;
            }
        }

        throw new ApiError(500, "Could not generate a unique order number. Please try again.");
    }

    static async updateSubmissionStatus(
        businessId: string,
        submissionId: string,
        status: OrderSubmissionStatus,
        reason?: string
    ) {
        const submission = await prisma.orderSubmission.findFirst({
            where: { id: submissionId, businessId },
        });

        if (!submission) throw new ApiError(404, "Submission not found");

        if (submission.status === OrderSubmissionStatus.CONVERTED) {
            throw new ApiError(400, "Cannot change status. Submission is already converted to an order.");
        }

        return prisma.orderSubmission.update({
            where: { id: submissionId },
            data: {
                status,
                rejectionReason: status === OrderSubmissionStatus.REJECTED ? reason || "No reason provided" : null,
            },
        });
    }
}