import { prisma } from "../../lib/prisma.js";
import { ShipmentStatus } from "../../../generated/prisma/enums.js";

export class WebhookService {
    static async handleSteadfastUpdate(payload: any) {
        // Steadfast payload typically looks like:
        // { consignment_id: 12345, invoice: "ORD-A1B2C3", status: "in_transit", tracking_message: "Received at sorting hub", updated_at: "..." }

        const { consignment_id, invoice, status, tracking_message } = payload;

        if (!consignment_id && !invoice) {
            console.warn("Webhook missing consignment_id and invoice", payload);
            return;
        }

        // 1. Find the shipment
        const shipment = await prisma.shipment.findFirst({
            where: {
                OR: [
                    { consignmentId: consignment_id?.toString() },
                    { order: { orderNumber: invoice } }
                ]
            }
        });

        if (!shipment) {
            // console.warn(`Shipment not found for webhook: ${consignment_id} / ${invoice}`);
            return;
        }

        // 2. Map Steadfast status to our internal ShipmentStatus enum
        let newStatus = shipment.status;
        const normalizedStatus = status?.toLowerCase() || "";

        if (normalizedStatus.includes("delivered"))
            newStatus = ShipmentStatus.DELIVERED;

        else if (normalizedStatus.includes("cancel"))
            newStatus = ShipmentStatus.CANCELLED;

        else if (normalizedStatus.includes("transit") || normalizedStatus.includes("hold"))
            newStatus = ShipmentStatus.IN_TRANSIT;
        
        else if (normalizedStatus.includes("pending") || normalizedStatus.includes("booked")) 
            newStatus = ShipmentStatus.BOOKED;

        // 3. Prevent duplicate events if Steadfast retries the webhook
        const existingEvent = await prisma.shipmentEvent.findFirst({
            where: {
                shipmentId: shipment.id,
                status: tracking_message || newStatus, // Using description to deduplicate
            }
        });

        if (existingEvent) {
            console.log("Duplicate webhook received, ignoring.");
            return;
        }

        // 4. Update Shipment and create Event in a transaction
        await prisma.$transaction([
            prisma.shipment.update({
                where: { id: shipment.id },
                data: { status: newStatus },
            }),
            prisma.shipmentEvent.create({
                data: {
                    shipmentId: shipment.id,
                    status: newStatus,
                    description: tracking_message || `Status updated to ${newStatus}`,
                    eventTime: new Date(), // Or use payload.updated_at if provided
                },
            })
        ]);

        // console.log(`📦 Webhook processed: Order ${invoice} is now ${newStatus}`);
    }
}