import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/queue.js";
import { MetaAdapter } from "../modules/integrations/meta/meta.adapter.js";
import { decrypt } from "../lib/encryption.js";
import { NotificationStatus } from "../../generated/prisma/enums.js";
import { env } from "../config/env.js";

export const notificationWorker = new Worker(
    "notification-queue",
    async (job) => {
        if (job.name === "send-order-confirmation") {
            const { businessId, orderId, invoiceUrl } = job.data;

            // 1. Fetch Order and Submission details
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { submission: true, shipment: true },
            });

            if (!order || !order.submission.customerPsid) {
                throw new Error("Order or Customer PSID not found");
            }

            // 2. Get the seller's Page Access Token
            const connection = await prisma.socialConnection.findUnique({
                where: { businessId },
            });

            if (!connection)
                throw new Error("No Facebook Page connected");

            const pageAccessToken = decrypt(connection.pageAccessToken);

            // 3. Construct the message
            const trackingUrl = order.shipment?.trackingToken
                ? `${env.FRONTEND_URL}/track/${order.shipment.trackingToken}`
                : "Tracking will be available soon.";


            const messageText = `Hi ${order.customerName},\n\nThank you for your order! Your order #${order.orderNumber} is confirmed.\n\n📍 Track your parcel: ${trackingUrl}\n🧾 Download your invoice (PDF): ${invoiceUrl}\n\nIf you need any help, we are always here for you.`;

            // 4. Create Notification record & Send
            const notification = await prisma.notification.create({
                data: {
                    businessId,
                    orderId,
                    channel: "MESSENGER",
                    recipientId: order.submission.customerPsid,
                    template: "order_confirmed",
                    status: NotificationStatus.PENDING,
                },
            });

            try {
                await MetaAdapter.sendMessage(pageAccessToken, order.submission.customerPsid, messageText);

                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { status: NotificationStatus.SENT },
                });
            } catch (error: any) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { status: NotificationStatus.FAILED, errorMsg: error.message },
                });
                throw error;
            }
        }
    },
    { connection: redisConnection }
);