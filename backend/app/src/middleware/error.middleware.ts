import { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { ApiError } from "../utils/AppError.js";
import { Prisma } from "../../generated/prisma/client.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let details: any = undefined;

    // 1. Handle Custom ApiError
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    // 2. Handle Multer Errors (File uploads)
    else if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            statusCode = 413;
            message = "File is too large. Maximum size allowed is 5MB.";
        } else if (err.code === "LIMIT_FILE_COUNT") {
            statusCode = 413;
            message = "Too many files uploaded. Maximum is 5 files.";
        } else {
            statusCode = 400;
            message = `Upload error: ${err.message}`;
        }
    }

    // 3. Handle Zod Validation Errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Error";
        details = err.issues.map((e: any) => ({
            field: e.path.join("."),
            message: e.message,
        }));
    }

    // 4. Handle Prisma Database Errors
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            statusCode = 409;
            message = "A record with this value already exists.";
            details = { target: err.meta?.target };
        } else if (err.code === "P2025") {
            statusCode = 404;
            message = "Record not found.";
        }
    }

    // 5. Fallback
    else if (err instanceof Error) {
        message = err.message;
    }

    if (process.env.NODE_ENV === "development") {
        console.error("🔥 [Error]:", err);
    }

    res.status(statusCode).json({
        status: "error",
        message,
        ...(details && { details }),
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};