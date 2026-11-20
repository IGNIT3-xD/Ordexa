import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redisConnection } from "../lib/queue.js";

const worker = new Worker("user-cleanup", async (job) => {
    const { userId } = job.data;
    console.log(`[Worker] Checking user ${userId} for verification...`);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // If user exists AND is not verified, delete them
    if (user && !user.isVerified) {
        await prisma.user.delete({ where: { id: userId } });
        console.log(`[Worker] Deleted unverified user ${userId}`);
    } else {
        console.log(`[Worker] User ${userId} is verified or deleted. Skipping.`);
    }
},
    { connection: redisConnection }
);

console.log("👷 Cleanup worker is running...");