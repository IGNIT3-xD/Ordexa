import express, {
    type ErrorRequestHandler,
    type Request,
    type Response,
    type NextFunction,
} from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { prisma } from "./src/lib/prisma";

export function createApp() {
    const app = express();

    app.disable("x-powered-by");
    app.use(cors());
    app.use(express.json({ limit: "1mb" }));
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

    app.use((req, res) => {
        res.status(404).json({
            error: {
                code: "NOT_FOUND",
                message: `Route ${req.method} ${req.originalUrl} not found`,
            },
        });
    });

    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
        console.error("[api] unhandled error:", err);
        res.status(500).json({
            error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
        });
    };
    app.use(errorHandler);

    return app;
}