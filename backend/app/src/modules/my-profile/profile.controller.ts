import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler";
import { UserService } from "./profile.service";
import { ApiError } from "../../utils/AppError";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const user = await UserService.getProfile(userId);
    res.json(user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { name, email } = req.body;
    const updatedUser = await UserService.updateProfile(userId, { name, email });
    res.json(updatedUser);
});

export const updateProfilePic = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    if (!req.file) {
        throw new ApiError(400, "Please upload an image file");
    }

    const result = await UserService.updateProfilePic(userId, req.file.buffer);
    res.json(result);
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    const result = await UserService.updatePassword(userId, currentPassword, newPassword);

    // Clear auth cookies since we invalidated all sessions
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    res.json(result);
});