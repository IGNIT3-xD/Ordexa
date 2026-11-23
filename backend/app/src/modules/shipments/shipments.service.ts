import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { OrderStatus, ShipmentStatus } from "../../../generated/prisma/enums.js";
import { shipmentQueue } from "../../lib/queue.js";
import crypto from "node:crypto";

const jobOptions = {
    attempts: 3,
    backoff: {
        type: "exponential" as const,
        delay: 5000, // 5s → 10s → 20s
    },
    removeOnComplete: 100,
    removeOnFail: 500,
};

export class ShipmentService {
    static async bookShipment(businessId: string, orderId: string) {
        const order = await prisma.order.findFirst({
            where: { id: orderId, businessId },
            include: { shipment: true },
        });

        if (!order)
            throw new ApiError(404, "Order not found");

        if (order.status !== OrderStatus.CONFIRM) {
            throw new ApiError(400, "Only confirmed orders can be shipped");
        }

        if (order.shipment) {
            throw new ApiError(400, "Shipment already exists for this order");
        }

        // Create the shipment in PENDING state
        const shipment = await prisma.shipment.create({
            data: {
                businessId,
                orderId: order.id,
                status: ShipmentStatus.PENDING,
                trackingToken: crypto.randomBytes(32).toString("hex")
            },
        });

        // Add to Queue
        await shipmentQueue.add("book-steadfast", { shipmentId: shipment.id }, jobOptions);

        return shipment;
    }

    static async listShipments(
        businessId: string,
        status?: ShipmentStatus,
        search?: string,
        page = 1,
        limit = 10
    ) {
        const skip = (page - 1) * limit;

        const searchFilter = search
            ? {
                OR: [
                    { trackingCode: { contains: search, mode: "insensitive" as const } },
                    { consignmentId: { contains: search } },
                    { order: { orderNumber: { contains: search, mode: "insensitive" as const } } },
                    { order: { customerPhone: { contains: search } } },
                ],
            }
            : {};

        const whereClause = {
            businessId,
            ...(status && { status }),
            ...searchFilter,
        };

        const [shipments, total] = await Promise.all([
            prisma.shipment.findMany({
                where: whereClause,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            customerName: true,
                            customerPhone: true,
                            totalAmount: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.shipment.count({ where: whereClause }),
        ]);

        return {
            data: shipments,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    static async getShipmentById(businessId: string, shipmentId: string) {
        const shipment = await prisma.shipment.findFirst({
            where: { id: shipmentId, businessId },
            include: {
                order: {
                    include: { items: true },
                },
                events: {
                    orderBy: { eventTime: "desc" },
                },
            },
        });

        if (!shipment) throw new ApiError(404, "Shipment not found");
        return shipment;
    }

    static async retryShipment(businessId: string, shipmentId: string) {
        const shipment = await prisma.shipment.findFirst({
            where: { id: shipmentId, businessId },
        });

        if (!shipment)
            throw new ApiError(404, "Shipment not found");

        // Only failed shipments can be retried
        if (shipment.status !== ShipmentStatus.FAILED) {
            throw new ApiError(400, "Only failed shipments can be retried");
        }

        // 1. Reset status to PENDING
        const updatedShipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                status: ShipmentStatus.PENDING,
                consignmentId: null, // Clean up any partial data
                trackingCode: null,
            },
        });

        // 2. Push job back into the BullMQ queue
        await shipmentQueue.add("book-steadfast", { shipmentId: shipment.id }, jobOptions);

        return { message: "Shipment retry queued successfully", shipment: updatedShipment };
    }

    static async getPublicTracking(trackingToken: string) {
        const shipment = await prisma.shipment.findUnique({
            where: { trackingToken },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        customerName: true,
                        deliveryAddress: true,
                        items: { select: { productName: true, variantName: true, quantity: true } },
                    },
                },
                events: {
                    orderBy: { eventTime: "desc" },
                },
            },
        });

        if (!shipment)
            throw new ApiError(404, "Invalid tracking link");

        return {
            orderNumber: shipment.order.orderNumber,
            customerName: shipment.order.customerName,
            deliveryAddress: shipment.order.deliveryAddress,
            items: shipment.order.items,
            provider: shipment.provider,
            trackingCode: shipment.trackingCode,
            status: shipment.status,
            timeline: shipment.events.map((e) => ({
                status: e.status,
                description: e.description,
                eventTime: e.eventTime,
            })),
        };
    }
}