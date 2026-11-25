import { type ErrorRequestHandler, type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/AppError.js";
import { Prisma } from "../../generated/prisma/client.js";

export const errorHandler: ErrorRequestHandler = (
    err,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let details: any = undefined;

    // 1. Handle Custom ApiError
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // 2. Handle Zod Validation Errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Error";
    }

    // 3. Handle Prisma Database Errors
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = 409; // Conflict
            message = "A record with this value already exists.";
            details = { target: err.meta?.target };
        } else if (err.code === "P2025") {
            statusCode = 404; // Not Found
            message = "Record not found.";
        }
    }

    // 4. Fallback for generic errors
    else if (err instanceof Error) {
        message = err.message;
    }

    // Log the error in development
    if (process.env.NODE_ENV === "development") {
        console.error("🔥 [Error]:", err);
    }

    // Return the standard error response
    res.status(statusCode).json({
        status: "error",
        message,
        ...(details && { details }), // Only include details if they exist
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

// 404 handler for unmatched routes (must be placed after all routes)
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        status: "error",
        message: `Route ${req.method} ${req.originalUrl} not found`,
    });
};