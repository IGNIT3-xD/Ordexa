import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string, sessionId: string) => {
    return jwt.sign({ userId, sessionId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};