import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { ProductStatus } from "../../../generated/prisma/enums.js";

export class FormService {
    static async createForm(businessId: string, data: { name: string; description?: string }) {
        return prisma.orderForm.create({
            data: { businessId, ...data },
        });
    }

    static async listForms(businessId: string) {
        return prisma.orderForm.findMany({
            where: { businessId },
            include: { _count: { select: { submissions: true, tokens: true } } },
            orderBy: { createdAt: "desc" },
        });
    }

    static async generateToken(businessId: string, formId: string) {
        const form = await prisma.orderForm.findFirst({
            where: { id: formId, businessId },
        });

        if (!form)
            throw new ApiError(404, "Form not found");

        // 1. Generate a raw 32-byte token
        const rawToken = crypto.randomBytes(32).toString("hex");

        // 2. Hash it (we only store the hash in the DB)
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        // 3. Save to DB (expires in 7 days by default)
        await prisma.formToken.create({
            data: {
                formId,
                tokenHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // 4. Return the raw token ONCE. The frontend will build the URL.
        return { rawToken, expiresInDays: 7 };
    }

    // PUBLIC: Get form data by token
    static async getPublicForm(rawToken: string) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        const token = await prisma.formToken.findUnique({
            where: { tokenHash },
            include: {
                form: {
                    include: {
                        business: { select: { name: true } },
                    },
                },
            },
        });

        // Security checks
        if (!token)
            throw new ApiError(404, "Invalid link");

        if (token.consumedAt)
            throw new ApiError(400, "This link has already been used");

        if (token.revokedAt)
            throw new ApiError(400, "This link has been revoked");

        if (token.expiresAt < new Date())
            throw new ApiError(400, "This link has expired");

        // Fetch active products for this business
        const products = await prisma.product.findMany({
            where: { businessId: token.form.businessId, status: ProductStatus.ACTIVE, isDeleted: false },
            select: {
                id: true,
                name: true,
                description: true,
                images: { where: { isPrimary: true }, select: { url: true } },
                variants: {
                    where: { isDeleted: false },
                    select: { id: true, size: true, color: true, price: true, stock: true },
                },
            },
        });

        return {
            businessName: token.form.business.name,
            formName: token.form.name,
            formDescription: token.form.description,
            products,
        };
    }

    // PUBLIC: Submit the order
    static async submitOrder(rawToken: string, data: any) {
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

        // 1. Validate token again (inside transaction)
        return prisma.$transaction(async (tx) => {
            const token = await tx.formToken.findUnique({
                where: { tokenHash },
                include: { form: true },
            });

            if (!token || token.consumedAt || token.revokedAt || token.expiresAt < new Date()) {
                throw new ApiError(400, "Invalid or expired link");
            }

            // 2. Verify items and calculate total on the SERVER
            const variantIds = data.items.map((i: any) => i.variantId);

            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds }, businessId: token.form.businessId, isDeleted: false },
            });

            if (variants.length !== variantIds.length) {
                throw new ApiError(400, "One or more items are no longer available");
            }

            // 3. Create the Submission
            const submission = await tx.orderSubmission.create({
                data: {
                    businessId: token.form.businessId,
                    formId: token.form.id,
                    formTokenId: token.id,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    deliveryAddress: data.deliveryAddress,
                    items: data.items,
                },
            });

            // 4. Consume the token (Atomically)
            await tx.formToken.update({
                where: { id: token.id },
                data: { consumedAt: new Date() },
            });

            return { message: "Order submitted successfully", submissionId: submission.id };
        });
    }
}