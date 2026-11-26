import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        currentPassword: z.string().optional(), // <-- Add this
    }).refine((data) => {
        // If email is being changed, currentPassword MUST be provided
        if (data.email && !data.currentPassword)
            return false;
        return true;
    }, {
        message: "Current password is required to change email",
        path: ["currentPassword"],
    }),
});

export const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(8, { error: "Current password is required" }),
        newPassword: z
            .string()
            .min(8, { error: "Password must be at least 8 characters long" })
            .regex(/[A-Z]/, { error: "Password must contain at least one uppercase letter" })
            .regex(/[a-z]/, { error: "Password must contain at least one lowercase letter" })
            .regex(/[0-9]/, { error: "Password must contain at least one number" })
            .regex(/[^A-Za-z0-9]/, { error: "Password must contain at least one special character" }),
    }),
});