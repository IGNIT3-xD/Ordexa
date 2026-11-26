import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";
import { sendVerificationEmail } from "../../lib/mailer.js";
import crypto from "node:crypto";
import { ApiError } from "../../utils/AppError.js";

export class UserService {
    static async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, profilePic: true, isVerified: true, createdAt: true },
        });

        if (!user) throw new ApiError(404, "User not found");
        return user;
    }

    static async updateProfile(
        userId: string,
        data: { name?: string; email?: string; currentPassword?: string }
    ) {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser)
            throw new ApiError(404, "User not found");

        let isVerified = currentUser.isVerified;
        let emailChanged = false;

        // Handle Email Change Security
        if (data.email && data.email !== currentUser.email) {
            // Verify password
            const valid = await bcrypt.compare(data.currentPassword || "", currentUser.password);
            if (!valid)
                throw new ApiError(401, "Incorrect password. Cannot change email.");

            // Check if new email is already taken
            const existing = await prisma.user.findUnique({ where: { email: data.email } });
            if (existing)
                throw new ApiError(409, "Email already in use");

            isVerified = false;
            emailChanged = true;
        }

        // 2. Update User
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name ?? currentUser.name,
                email: data.email ?? currentUser.email,
                isVerified,
            },
            select: { id: true, email: true, name: true, profilePic: true, isVerified: true },
        });

        // If email changed, force logout and send new code
        if (emailChanged) {
            // Invalidate all sessions (forces re-login)
            await prisma.userSession.deleteMany({ where: { userId } });

            // Generate & Send new verification code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await prisma.verificationToken.create({
                data: { token: code, userId, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
            });
            await sendVerificationEmail(updatedUser.email, code, updatedUser.name || undefined);
        }

        return updatedUser;
    }

    static async updateProfilePic(userId: string, fileBuffer: Buffer) {
        const profilePic = await uploadToCloudinary(fileBuffer);

        return prisma.user.update({
            where: { id: userId },
            data: { profilePic },
            select: { id: true, profilePic: true },
        });
    }

    static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ApiError(404, "User not found");

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new ApiError(401, "Incorrect current password");

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and invalidate all other sessions for security
        await prisma.$transaction([
            prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } }),
            prisma.userSession.deleteMany({ where: { userId } }),
        ]);

        return { message: "Password updated successfully. Please log in again." };
    }
}