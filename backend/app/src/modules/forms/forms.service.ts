import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { ProductStatus } from "../../../generated/prisma/enums.js";

export class FormService {
    static async createForm(businessId: string, data: { name: string; description?: string }) {
        const rawToken = crypto.randomBytes(32).toString("hex");

        const form = await prisma.orderForm.create({
            data: {
                businessId,
                name: data.name,
                description: data.description,
                tokens: {
                    create: {
                        token: rawToken,
                        expiresAt: null,
                    },
                },
            },
            include: {
                tokens: true,
            },
        });

        return form;
    }

    static async listForms(businessId: string) {
        return prisma.orderForm.findMany({
            where: { businessId },
            include: {
                _count: { select: { submissions: true, tokens: true } },
                tokens: {
                    select: {
                        id: true,
                        token: true, // <-- Return raw token so frontend can build the link
                        createdAt: true,
                        expiresAt: true,
                        revokedAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    static async generateToken(businessId: string, formId: string) {
        const form = await prisma.orderForm.findFirst({
            where: { id: formId, businessId },
        });

        if (!form)
            throw new ApiError(404, "Form not found");

        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenRecord = await prisma.formToken.create({
            data: {
                formId,
                token: rawToken,
                expiresAt: null,
            },
        });

        return { rawToken, tokenId: tokenRecord.id };
    }

    // PUBLIC: Get form data by token
    static async getPublicForm(rawToken: string) {
        const token = await prisma.formToken.findUnique({
            where: { token: rawToken },
            include: {
                form: {
                    include: {
                        business: { select: { name: true } },
                    },
                },
            },
        });

        if (!token) throw new ApiError(404, "Invalid link");
        if (token.revokedAt) throw new ApiError(400, "This link has been revoked");
        if (token.expiresAt && token.expiresAt < new Date()) throw new ApiError(400, "This link has expired");
        if (!token.form.isActive) throw new ApiError(400, "This store is currently closed");

        const products = await prisma.product.findMany({
            where: { businessId: token.form.businessId, status: "ACTIVE", isDeleted: false },
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
        return prisma.$transaction(async (tx) => {
            const token = await tx.formToken.findUnique({
                where: { token: rawToken }, // Query by raw token
                include: { form: true },
            });

            if (!token || token.revokedAt || (token.expiresAt && token.expiresAt < new Date())) {
                throw new ApiError(400, "Invalid or expired link");
            }
            if (!token.form.isActive) {
                throw new ApiError(400, "This store is currently closed");
            }

            const variantIds = data.items.map((i: any) => i.variantId);
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds }, businessId: token.form.businessId, isDeleted: false },
            });

            if (variants.length !== variantIds.length) {
                throw new ApiError(400, "One or more items are no longer available");
            }

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

            return { message: "Order submitted successfully", submissionId: submission.id };
        });
    }

    static async updateFormStatus(businessId: string, formId: string, isActive: boolean) {
        const form = await prisma.orderForm.findFirst({ where: { id: formId, businessId } });

        if (!form)
            throw new ApiError(404, "Form not found");

        return prisma.orderForm.update({
            where: { id: formId },
            data: { isActive },
        });
    }
}