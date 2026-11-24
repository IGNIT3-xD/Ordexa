import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/queue.js";
import { MetaAdapter } from "../modules/integrations/meta/meta.adapter.js";
import { decrypt } from "../lib/encryption.js";

export const notificationWorker = new Worker(
    "notification-queue",
    async (job) => {
        if (job.name === "send-message") {
            const { businessId, orderId, psid, template, variables } = job.data;

            // 1. Get the seller's Page Access Token
            const connection = await prisma.socialConnection.findUnique({
                where: { businessId },
            });

            if (!connection)
                throw new Error("No Facebook Page connected for this business");

            const pageAccessToken = decrypt(connection.pageAccessToken);

            // 2. Create a Notification record
            const notification = await prisma.notification.create({
                data: {
                    businessId,
                    orderId,
                    channel: "MESSENGER",
                    recipientId: psid,
                    template,
                    status: "PENDING",
                },
            });

            // 3. Send via Meta API
            try {
                const textMessage = `Hi ${variables[0]}, your order ${variables[1]} is confirmed! Track here: ${variables[2]}`;
                await MetaAdapter.sendMessage(pageAccessToken, psid, textMessage);

                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { status: "SENT" },
                });
            } catch (error: any) {
                await prisma.notification.update({
                    where: { id: notification.id },
                    data: { status: "FAILED", errorMsg: error.message },
                });

                throw error;
            }
        }
    },
    { connection: redisConnection }
);