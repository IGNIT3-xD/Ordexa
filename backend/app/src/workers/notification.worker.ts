import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/queue.js";
import { MetaAdapter } from "../modules/integrations/meta/meta.adapter.js";
import { decrypt } from "../lib/encryption.js";
import { env } from "../config/env.js";

export const notificationWorker = new Worker(
    "notification-queue",
    async (job) => {
        console.log(`\n🚀 [NotificationWorker] Received job: ${job.name} (ID: ${job.id})`);
        console.log(`📦 [NotificationWorker] Data:`, job.data);

        if (job.name === "send-order-confirmation") {
            const { businessId, orderId, invoiceUrl } = job.data;

            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { submission: true, shipment: true },
            });

            if (!order) {
                console.error(`❌ [NotificationWorker] Order not found: ${orderId}`);
                throw new Error("Order not found");
            }

            if (!order.submission.customerPsid) {
                console.error(`❌ [NotificationWorker] Missing customerPsid for Order: ${orderId}`);
                throw new Error("Missing customerPsid");
            }

            const connection = await prisma.socialConnection.findUnique({
                where: { businessId },
            });

            if (!connection) {
                console.error(`❌ [NotificationWorker] No Facebook Page connected for Business: ${businessId}`);
                throw new Error("No Facebook Page connected");
            }

            const pageAccessToken = decrypt(connection.pageAccessToken);
            const trackingUrl = order.shipment?.trackingToken
                ? `${env.FRONTEND_URL}/track/${order.shipment.trackingToken}`
                : "Tracking will be available soon.";

            const messageText = `Hi ${order.customerName},\n\nThank you for your order! Your order #${order.orderNumber} is confirmed.\n\n📍 Track your parcel: ${trackingUrl}\n🧾 View your invoice: ${invoiceUrl}\n\nIf you need any help, we are always here for you.`;

            console.log(`📤 [NotificationWorker] Sending to PSID: ${order.submission.customerPsid}`);

            try {
                await MetaAdapter.sendMessage(pageAccessToken, order.submission.customerPsid, messageText);
                console.log(`✅ [NotificationWorker] Message sent successfully!`);
            } catch (error: any) {
                console.error(`❌ [NotificationWorker] Meta API Error:`, error.message);
                throw error;
            }
        }
    },
    { connection: redisConnection }
);

notificationWorker.on("failed", (job, err) => {
    console.error(`❌ [NotificationWorker] Job ${job?.id} failed:`, err.message);
});

notificationWorker.on("completed", (job) => {
    console.log(`✅ [NotificationWorker] Job ${job.id} completed successfully.`);
});