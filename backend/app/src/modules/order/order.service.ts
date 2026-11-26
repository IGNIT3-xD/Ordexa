import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { OrderStatus } from "../../../generated/prisma/enums.js";
import { notificationQueue } from "../../lib/queue.js";
import { env } from "../../config/env.js";
import crypto from "node:crypto";

export class OrderService {
    static async updateOrderStatus(businessId: string, orderId: string, newStatus: OrderStatus, actorId: string) {
        return prisma.$transaction(async (tx: any) => {
            const order = await tx.order.findFirst({
                where: { id: orderId, businessId },
                include: { items: true },
            });

            if (!order)
                throw new ApiError(404, "Order not found");

            if (order.status === newStatus)
                return order;

            // CASE 1: Confirming an Order (Deduct Stock)
            if (newStatus === OrderStatus.CONFIRM && order.status === OrderStatus.PENDING_CONFIRMATION) {
                for (const item of order.items) {
                    const result = await tx.productVariant.updateMany({
                        where: { id: item.variantId, businessId, stock: { gte: item.quantity } },
                        data: { stock: { decrement: item.quantity } },
                    });

                    if (result.count !== 1) {
                        throw new ApiError(400, `Insufficient stock for product: ${item.productName}`);
                    }

                    await tx.stockMovement.create({
                        data: { variantId: item.variantId, quantity: -item.quantity, reason: `Order Confirmed: ${order.orderNumber}`, actorId },
                    });
                }
            }

            // CASE 2: Cancelling a Confirmed Order (Restock)
            else if (newStatus === OrderStatus.CANCELLED && order.status === OrderStatus.CONFIRM) {
                for (const item of order.items) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { increment: item.quantity } },
                    });

                    await tx.stockMovement.create({
                        data: { variantId: item.variantId, quantity: item.quantity, reason: `Order Cancelled (Restock): ${order.orderNumber}`, actorId },
                    });
                }
            }

            // CASE 3: Re-confirming a Cancelled Order (Deduct Stock Again)
            else if (newStatus === OrderStatus.CONFIRM && order.status === OrderStatus.CANCELLED) {
                for (const item of order.items) {
                    const result = await tx.productVariant.updateMany({
                        where: { id: item.variantId, businessId, stock: { gte: item.quantity } },
                        data: { stock: { decrement: item.quantity } },
                    });

                    if (result.count !== 1) {
                        throw new ApiError(400, `Insufficient stock to re-confirm product: ${item.productName}`);
                    }

                    await tx.stockMovement.create({
                        data: { variantId: item.variantId, quantity: -item.quantity, reason: `Order Re-Confirmed: ${order.orderNumber}`, actorId },
                    });
                }
            }

            let invoiceUrl = order.invoiceUrl;
            let invoiceToken = order.invoiceToken;

            // Generate the capability token once. Gating on the token (not the
            // URL) also heals legacy orders that still point at the old URL.
            if (newStatus === OrderStatus.CONFIRM && !invoiceToken) {
                invoiceToken = crypto.randomBytes(32).toString("hex");
                invoiceUrl = `${env.BACKEND_URL}/api/public/invoices/${invoiceToken}`;
            }

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    invoiceUrl: invoiceUrl,
                    invoiceToken: invoiceToken,
                },
            });
            
            if (newStatus === OrderStatus.CONFIRM) {
                await notificationQueue.add("send-order-confirmation", {
                    businessId,
                    orderId: updatedOrder.id,
                    invoiceUrl: invoiceUrl,
                });
            }

            return updatedOrder
        });
    }

    static async listOrders(
        businessId: string,
        status?: OrderStatus,
        search?: string,
        page = 1,
        limit = 10
    ) {
        const skip = (page - 1) * limit;

        const searchFilter = search
            ? {
                OR: [
                    { orderNumber: { contains: search, mode: "insensitive" as const } },
                    { customerPhone: { contains: search } },
                    { customerName: { contains: search, mode: "insensitive" as const } },
                ],
            } : {};

        const whereClause = {
            businessId,
            ...(status && { status }),
            ...searchFilter,
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                include: {
                    items: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.order.count({ where: whereClause }),
        ]);

        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}