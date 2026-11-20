import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/AppError.js";

export const verifyResetToken = (req: Request, res: Response, next: NextFunction) => {
    // Read from cookies instead of headers
    const token = req.cookies?.resetToken;

    if (!token) {
        return next(new ApiError(401, "Missing or expired reset token. Please request a new code."));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; type: string };

        if (decoded.type !== "password_reset") {
            return next(new ApiError(401, "Invalid token type"));
        }

        (req as any).userId = decoded.userId;
        
        next();
    } catch (err) {
        next(new ApiError(401, "Invalid or expired reset token"));
    }
};