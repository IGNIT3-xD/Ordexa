import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { prisma } from "./src/lib/prisma";
import { errorHandler } from "./src/middleware/error.middleware";

export function createApp() {
    const app = express();

    app.disable("x-powered-by");
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use((req: Request, res: Response, next: NextFunction) => {
        const id = req.header("x-request-id") ?? randomUUID();
        res.setHeader("x-request-id", id);
        next();
    });

    // Health check — pings the DB. 200 = all good, 503 = DB unreachable.
    app.get("/health", async (_req, res) => {
        const started = Date.now();
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.status(200).json({
                status: "ok",
                service: "ordexa-api",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                db: {
                    connected: true,
                    latencyMs: Date.now() - started,
                },
            });
        } catch (err) {
            console.error("[health] DB check failed:", err);
            res.status(503).json({
                status: "degraded",
                service: "Ordexa-api",
                timestamp: new Date().toISOString(),
                db: {
                    connected: false,
                    latencyMs: Date.now() - started,
                    error: err instanceof Error ? err.message : String(err),
                },
            });
        }
    });

    app.get("/api", (_req, res) => {
        res.json({ message: "Ordexa API" });
    });

    // 404 Not found
    app.use((req, res) => {
        res.status(404).json({
            error: {
                code: "NOT_FOUND",
                message: `Route ${req.method} ${req.originalUrl} not found`,
            },
        });
    });

    app.use(errorHandler);

    return app;
}