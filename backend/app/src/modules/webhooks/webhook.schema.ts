import { z } from "zod";

export const steadfastWebhookSchema = z.object({
    body: z
        .object({
            consignment_id: z
                .union([z.string(), z.number()])
                .nullish()
                .transform((value) => value ?? undefined),
            invoice: z
                .string()
                .min(1)
                .nullish()
                .transform((value) => value ?? undefined),
            status: z.string().min(1, "Status is required"),
            tracking_message: z
                .string()
                .nullish()
                .transform((value) => value ?? undefined),
            updated_at: z
                .union([z.string(), z.number()])
                .nullish()
                .transform((value) => value ?? undefined),
        })
        .refine((data) => data.consignment_id !== undefined || data.invoice !== undefined, {
            message: "Either consignment_id or invoice must be provided",
            path: ["consignment_id"],
        }),
});
