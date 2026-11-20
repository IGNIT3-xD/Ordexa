import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";

export const redisConnection = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    // If the cloud provider requires TLS (like Upstash or Redis Cloud), this enables it
    tls: env.REDIS_TLS ? {} : undefined,

    // Required for BullMQ to function correctly
    maxRetriesPerRequest: null,
});

// Optional: Log connection errors so you know if the host/pass is wrong
redisConnection.on("error", (err) => {
    console.error("❌ Redis Connection Error:", err.message);
});

redisConnection.on("connect", () => {
    console.log("✅ Connected to Hosted Redis");
});

export const cleanupQueue = new Queue("user-cleanup", {
    connection: redisConnection,
});