import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ShipmentStatus } from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";

const TERMINAL_STATUSES: ShipmentStatus[] = [
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
];

const mapStatus = (raw: string | undefined, current: ShipmentStatus): ShipmentStatus => {
    const normalized = raw?.toLowerCase() || "";

    if (normalized.includes("delivered")) return ShipmentStatus.DELIVERED;
    if (normalized.includes("cancel")) return ShipmentStatus.CANCELLED;
    if (normalized.includes("transit") || normalized.includes("hold")) return ShipmentStatus.IN_TRANSIT;
    if (normalized.includes("pending") || normalized.includes("booked")) return ShipmentStatus.BOOKED;

    return current;
};

const parseEventTime = (raw: string | number | undefined): Date => {
    if (raw !== undefined) {
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
};

export class WebhookService {
    static async handleSteadfastUpdate(payload: {
        consignment_id?: string | number;
        invoice?: string;
        status: string;
        tracking_message?: string;
        updated_at?: string | number;
    }) {
        const { consignment_id, invoice, status, tracking_message, updated_at } = payload;

        let shipment = null;

        // Resolve by a single trusted identifier. consignmentId is globally
        // unique; orderNumber is now globally unique as well.
        if (consignment_id != null) {
            shipment = await prisma.shipment.findFirst({
                where: {
                    consignmentId: consignment_id.toString(),
                    provider: "STEADFAST",
                },
            });
        } else if (invoice) {
            shipment = await prisma.shipment.findFirst({
                where: {
                    order: { orderNumber: invoice },
                    provider: "STEADFAST",
                },
            });
        }

        if (!shipment) {
            return;
        }

        const newStatus = mapStatus(status, shipment.status);

        // State machine: never move a terminal shipment back to an active state.
        if (TERMINAL_STATUSES.includes(shipment.status) && newStatus !== shipment.status) {
            console.warn(
                `⚠️ Ignoring webhook regression for shipment ${shipment.id}: ${shipment.status} -> ${newStatus}`
            );
            return;
        }

        const eventTime = parseEventTime(updated_at);

        // Idempotency key derived from the event identity. When the provider
        // does not send a timestamp we fall back to status + message so that
        // retried deliveries are still deduplicated.
        const dedupeKey = crypto
            .createHash("sha256")
            .update(
                [
                    shipment.id,
                    newStatus,
                    tracking_message ?? "",
                    updated_at !== undefined ? String(updated_at) : "",
                ].join("|")
            )
            .digest("hex");

        try {
            await prisma.$transaction(async (tx) => {
                await tx.shipment.update({
                    where: { id: shipment.id },
                    data: { status: newStatus },
                });

                await tx.shipmentEvent.create({
                    data: {
                        shipmentId: shipment.id,
                        status: newStatus,
                        description: tracking_message || `Status updated to ${newStatus}`,
                        eventTime,
                        dedupeKey,
                    },
                });
            });
        } catch (error) {
            // A unique violation on dedupeKey means this exact event was
            // already processed (including concurrent retries).
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                return;
            }
            throw error;
        }
    }
}
