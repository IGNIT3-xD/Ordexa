import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/queue.js";

const worker = new Worker(
    "user-cleanup",
    async (job) => {
        const { userId } = job.data;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                verificationTokens: { orderBy: { expiresAt: "desc" }, take: 1 },
            },
        });

        // 1. User doesn't exist (already deleted, probably by another job)
        if (!user) {
            console.log(`[Cleanup] User ${userId} not found. Skipping.`);
            return;
        }

        // 2. User is already verified (e.g., they verified via a different session)
        if (user.isVerified) {
            console.log(`[Cleanup] User ${userId} is verified. Skipping.`);
            return;
        }

        // 3. User is unverified - check the latest verification token
        const latestToken = user.verificationTokens[0];

        // 3a. If there's no token at all, this is a weird state. Delete it.
        if (!latestToken) {
            console.log(`[Cleanup] User ${userId} has no verification tokens. Deleting.`);
            await prisma.user.delete({ where: { id: userId } });
            return;
        }

        // 3b. If the latest token has expired, the user had their chance. Delete.
        const now = new Date();
        if (latestToken.expiresAt < now) {
            console.log(`[Cleanup] User ${userId} failed to verify within window. Deleting.`);
            await prisma.user.delete({ where: { id: userId } });
            return;
        }

        // 3c. If the token is still valid (they have more time), skip.
        console.log(`[Cleanup] User ${userId} still has a valid verification window. Skipping.`);
    },
    { connection: redisConnection }
);

// console.log("👷 Cleanup worker is running...");