import { z } from "zod";
import { CourierProvider } from "../../../generated/prisma/enums";

export const connectCourierSchema = z.object({
    body: z.object({
        provider: z.enum(CourierProvider).default("STEADFAST"),
        apiKey: z.string().min(1, "API Key is required"),
        secretKey: z.string().min(1, "Secret Key is required"),
    }),
});