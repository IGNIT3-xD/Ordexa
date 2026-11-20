import { type Request, type Response } from "express";
import { AuthService } from "./auth.service.js";
import { asyncHandler } from "../../utils/AsyncHandler";
import { ApiError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";

const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production", // Only send over HTTPS in production
    sameSite: "strict" as const, // Protects against CSRF
};

const accessTokenOptions = {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
};

const refreshTokenOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh", // Only send this cookie to the refresh endpoint
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    // req.body is safely parsed by Zod middleware
    const { email, password, name } = req.body;

    const result = await AuthService.register({
        email,
        password,
        name,
        profilePicBuffer: req.file?.buffer,
    });

    res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    // Attach cookies to the response
    res.cookie("accessToken", result.accessToken, accessTokenOptions);
    res.cookie("refreshToken", result.refreshToken, refreshTokenOptions);

    // Send only the user object in the response body
    res.json({ user: result.user });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body

    const result = await AuthService.verifyEmail(email, code);

    res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        throw new ApiError(400, "Refresh token required");
    }

    await AuthService.logout(refreshToken);

    // Clear the cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    res.json({ message: "Logged out successfully" });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    const result = await AuthService.refresh(refreshToken);

    // Set new cookies
    res.cookie("accessToken", result.newAccessToken, accessTokenOptions);
    res.cookie("refreshToken", result.newRefreshToken, refreshTokenOptions);

    res.json({ message: "Token refreshed" });
});