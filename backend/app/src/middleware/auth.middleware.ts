import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/AppError.js";

export const protect = (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        return next(new ApiError(401, "Not authorized, no token"));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
        (req as any).userId = decoded.userId;

        next();
    } catch (err) {
        next(new ApiError(401, "Not authorized, token failed"));
    }
};