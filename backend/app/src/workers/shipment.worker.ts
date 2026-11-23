import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/queue.js";
import { SteadfastAdapter } from "../modules/couriers/steadfast.adapter.js";
import { decrypt } from "../lib/encryption.js";
import { ShipmentStatus } from "../../generated/prisma/enums.js";

export const shipmentWorker = new Worker(
    "shipment-queue",
    async (job) => {
        if (job.name !== "book-steadfast") return;

        const { shipmentId } = job.data;

        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: { order: true },
        });

        if (!shipment) throw new Error("Shipment not found");

        // 1. Get courier credentials
        const connection = await prisma.courierConnection.findUnique({
            where: {
                businessId_provider: {
                    businessId: shipment.businessId,
                    provider: "STEADFAST",
                },
            },
        });

        if (!connection || !connection.isActive) {
            await prisma.shipment.update({
                where: { id: shipmentId },
                data: { status: ShipmentStatus.FAILED },
            });
            throw new Error("No active Steadfast connection found");
        }

        // 2. Decrypt keys
        const credentials = {
            apiKey: decrypt(connection.apiKey),
            secretKey: decrypt(connection.secretKey),
        };

        try {
            // 3. Guard: check if this order was already booked on Steadfast
            const existing = await SteadfastAdapter.getOrderByInvoice(
                credentials,
                shipment.order.orderNumber
            );

            if (existing) {
                await prisma.shipment.update({
                    where: { id: shipmentId },
                    data: {
                        consignmentId: existing.consignmentId,
                        trackingCode: existing.trackingCode,
                        status: ShipmentStatus.BOOKED,
                    },
                });
                console.log(
                    `ℹ️ Shipment already existed on Steadfast for Order ${shipment.order.orderNumber} — reconciled.`
                );
                return;
            }

            // 4. Create new shipment
            const result = await SteadfastAdapter.createShipment(
                credentials,
                shipment.order
            );

            // 5. Update on success
            await prisma.shipment.update({
                where: { id: shipmentId },
                data: {
                    consignmentId: result.consignmentId,
                    trackingCode: result.trackingCode,
                    status: ShipmentStatus.BOOKED,
                },
            });

            console.log(`✅ Shipment booked for Order ${shipment.order.orderNumber}`);
        } catch (error) {
            // Only mark as FAILED after the final retry attempt.
            // While retries are still pending, leave it as PENDING so UI shows "Processing…"
            const totalAttempts = job.opts.attempts ?? 1;
            const isLastAttempt = job.attemptsMade + 1 >= totalAttempts;

            if (isLastAttempt) {
                await prisma.shipment.update({
                    where: { id: shipmentId },
                    data: { status: ShipmentStatus.FAILED },
                });
                console.error(
                    `❌ Shipment failed permanently for Order ${shipment.order.orderNumber}`
                );
            } else {
                console.warn(
                    `⚠️ Shipment attempt ${job.attemptsMade + 1}/${totalAttempts} failed for Order ${shipment.order.orderNumber} — will retry.`
                );
            }

            throw error; // Let BullMQ handle the retry
        }
    },
    {
        connection: redisConnection,
        // NOTE: No 'attempts' or 'backoff' here — those belong on the Queue.add() call
    }
);

shipmentWorker.on("failed", (job, err) => {
    console.error(`❌ Shipment job ${job?.id} failed:`, err.message);
});

shipmentWorker.on("completed", (job) => {
    console.log(`✅ Shipment job ${job.id} completed`);
});