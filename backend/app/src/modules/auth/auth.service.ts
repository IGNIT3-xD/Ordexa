import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import type { ILoginInput, IRegisterInput } from "./auth.type.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "../../lib/mailer.js";
import { cleanupQueue } from "../../lib/queue.js";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt.js";
import { createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import jwt from "jsonwebtoken";

export class AuthService {
    static async register(data: IRegisterInput) {
        const { email, password, profilePicBuffer, name } = data

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ApiError(409, "Email already in use");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Upload profile pic if provided
        let profilePic: string | undefined;

        if (profilePicBuffer) {
            profilePic = await uploadToCloudinary(profilePicBuffer);
        }

        // Generate a 6-digit numeric code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { email, password: hashedPassword, name, profilePic },
            });

            await tx.verificationToken.create({
                data: { token: code, userId: newUser.id, expiresAt },
            });

            return newUser;
        });

        // Send the code
        await sendVerificationEmail(user.email, code, user.name || undefined);

        // Add delayed job to delete the user if not verified in 15 minutes (900,000 ms)
        await cleanupQueue.add(
            "cleanup-unverified",
            { userId: user.id },
            { delay: 15 * 60 * 1000 }
        );

        return { message: "Registered. Please check your email for the 6-digit code." }
    }

    static async verifyEmail(email: string, code: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) throw new ApiError(404, "User not found");
        if (user.isVerified) throw new ApiError(400, "User is already verified");

        // Find token for this specific user
        const record = await prisma.verificationToken.findFirst({
            where: { userId: user.id, token: code },
        });

        if (!record || record.expiresAt < new Date()) {
            throw new ApiError(400, "Invalid or expired verification code");
        }

        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { isVerified: true } }),
            prisma.verificationToken.deleteMany({ where: { userId: user.id } }),
        ]);

        sendWelcomeEmail(user.email, user.name || undefined).catch(err => {
            console.error("Failed to send welcome email:", err);
        });

        return { message: "Email verified successfully. You can now log in." };
    }

    static async login(data: ILoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new ApiError(401, "Invalid credentials");
        }

        if (!user.isVerified) {
            throw new ApiError(403, "Please verify your email first");
        }

        const valid = await bcrypt.compare(data.password, user.password);
        if (!valid) {
            throw new ApiError(401, "Invalid credentials");
        }

        // Create session
        const session = await prisma.userSession.create({
            data: {
                userId: user.id,
                refreshHash: "pending", // Temporary placeholder
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id, session.id);

        // Update session with hashed refresh token
        const refreshHash = createHash("sha256").update(refreshToken).digest("hex")

        await prisma.userSession.update({
            where: { id: session.id },
            data: { refreshHash },
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePic: user.profilePic,
            },
        };
    }

    static async logout(refreshToken: string) {
        // Hash the token to find the session
        const refreshHash = createHash("sha256").update(refreshToken).digest("hex");

        // Delete the session
        // Using deleteMany to avoid throwing an error if the session doesn't exist

        await prisma.userSession.deleteMany({
            where: { refreshHash },
        });

        return { message: "Logged out successfully" };
    }

    static async refresh(refreshToken: string) {
        const refreshHash = createHash("sha256").update(refreshToken).digest("hex");

        const session = await prisma.userSession.findUnique({
            where: { refreshHash },
            include: { user: true }
        });

        if (!session || session.expiresAt < new Date()) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(session.user.id);
        const newRefreshToken = generateRefreshToken(session.user.id, session.id);

        // Update session with new hash (Rotation)
        const newRefreshHash = createHash("sha256").update(newRefreshToken).digest("hex");

        await prisma.userSession.update({
            where: { id: session.id },
            data: { refreshHash: newRefreshHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        });

        return { newAccessToken, newRefreshToken };
    }

    static async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        // SECURITY: Do not throw an error if the user doesn't exist.
        // This prevents bad actors from guessing which emails are registered.
        if (!user) {
            return { message: "If that email exists, a reset code has been sent." };
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Clean up any existing codes for this user to prevent spam
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        await prisma.passwordResetToken.create({
            data: { token: code, userId: user.id, expiresAt },
        });

        await sendPasswordResetEmail(user.email, code, user.name || undefined);

        return { message: "If that email exists, a reset code has been sent." };
    }

    static async verifyResetCode(email: string, code: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) throw new ApiError(400, "Invalid or expired code");

        const record = await prisma.passwordResetToken.findFirst({
            where: { userId: user.id, token: code },
        });

        if (!record || record.expiresAt < new Date()) {
            throw new ApiError(400, "Invalid or expired code");
        }

        // Delete the code immediately so it can't be reused
        await prisma.passwordResetToken.delete({ where: { id: record.id } });

        // Generate a temporary JWT specifically for resetting the password
        const resetToken = jwt.sign(
            { userId: user.id, type: "password_reset" },
            env.JWT_ACCESS_SECRET,
            { expiresIn: "10m" } // User has 10 minutes to enter the new password
        );

        return { resetToken };
    }

    static async resetPassword(userId: string, newPassword: string) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password AND invalidate all existing sessions (force logout everywhere)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            }),

            prisma.userSession.deleteMany({
                where: { userId },
            }),
        ]);

        return { message: "Password reset successfully. You can now log in." };
    }
}