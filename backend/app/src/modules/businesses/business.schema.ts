import { z } from "zod";
import { currency } from "../../../generated/prisma/enums";

export const createBusinessSchema = z.object({
    body: z.object({
        name: z.string().min(2, { error: "Business name must be at least 2 characters" }),
        slug: z
            .string()
            .min(3, { error: "Slug must be at least 3 characters" })
            .regex(/^[a-z0-9-]+$/, { error: "Slug can only contain lowercase letters, numbers, and hyphens" }),
    }),
});

export const updateBusinessSchema = z.object({
    body: z.object({
        name: z.string().min(2, { error: "Business name must be at least 2 characters" }).optional(),
        currency: z.enum([currency.BDT, currency.EUR, currency.USD]).optional(),
        timezone: z.string().optional(),
    }),
});