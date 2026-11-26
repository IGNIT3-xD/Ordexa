import { z } from "zod";

export const fraudCheckSchema = z.object({
    body: z.object({
        // Bangladesh phone regex: starts with 01, followed by 9 digits
        phone: z.string().regex(/^01[3-9]\d{8}$/, {
            message: "Invalid Bangladeshi phone number format (e.g., 01712345678)",
        }),
    }),
});