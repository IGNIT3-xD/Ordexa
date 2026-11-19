import { createApp } from "./app.js";
import { env } from "./src/config/env.js";
import { prisma } from "./src/lib/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, async () => {
    console.log(
        `⚪ [api] listening on ${env.BACKEND_API_URL} PORT: ${env.PORT} - (${env.NODE_ENV})`
    );

    await prisma.$connect()
    console.log("🟢 Database connected successfully.");
});

async function shutdown(signal: string) {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(async (err) => {
        try {
            await prisma.$disconnect();
        } catch (e) {
            console.error("🔴 [api] prisma disconnect error:", e);
        }
        if (err) {
            console.error("🔴 [api] server close error:", err);
            process.exit(1);
        }
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
    console.error("🔴 [api] unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("🔴 [api] uncaughtException:", err);
    process.exit(1);
});