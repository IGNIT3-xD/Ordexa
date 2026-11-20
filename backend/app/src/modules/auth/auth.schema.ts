import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        email: z.email({ error: "Please provide a valid email address" }),
        password: z
            .string()
            .min(8, { error: "Password must be at least 8 characters long" })
            .regex(/[A-Z]/, { error: "Password must contain at least one uppercase letter" })
            .regex(/[a-z]/, { error: "Password must contain at least one lowercase letter" })
            .regex(/[0-9]/, { error: "Password must contain at least one number" })
            .regex(/[^A-Za-z0-9]/, { error: "Password must contain at least one special character" }),
        name: z.string("Please, provide a valid name").min(4).max(50),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.email({ error: "Please provide a valid email address" }),
        password: z.string().min(1, { error: "Password is required" }),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        email: z.email({ error: "Please provide a valid email address" }),
        code: z.string().length(6, { error: "Verification code must be exactly 6 digits" }),
    }),
});