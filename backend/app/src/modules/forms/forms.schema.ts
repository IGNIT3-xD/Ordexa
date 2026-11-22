import { z } from "zod";

export const createFormSchema = z.object({
    body: z.object({
        name: z.string().min(2, { error: "Form name is required" }),
        description: z.string().optional(),
    }),
});

export const submitOrderSchema = z.object({
    body: z.object({
        customerName: z.string().min(2, { error: "Name is required" }),
        customerPhone: z.string().min(10, { error: "Valid phone number is required" }),
        deliveryAddress: z.string().min(5, { error: "Full address is required" }),
        // CRITICAL: We only accept variantId and quantity. 
        // The client CANNOT send prices. The server calculates it.
        items: z.array(
            z.object({
                variantId: z.string(),
                quantity: z.number().int().positive({ error: "Quantity must be greater than 0" }),
            })
        ).min(1, { error: "At least one item is required" }),
    }),
});

export const updateFormStatusSchema = z.object({
    body: z.object({
        isActive: z.boolean(),
    }),
});