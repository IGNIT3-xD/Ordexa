import { z } from "zod";

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string("Please, provide a valid name").min(4).max(50).optional(),
        email: z.email({ error: "Please provide a valid email address" }).optional(),
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