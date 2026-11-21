import { z } from "zod";
import { ProductStatus } from "../../../generated/prisma/enums";

const variantSchema = z.object({
    sku: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    price: z.coerce.number().positive({ error: "Price must be positive" }),
    stock: z.coerce.number().int().min(0, { error: "Stock cannot be negative" }),
});

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(2, { error: "Product name is required" }),
        description: z.string().optional(),
        // Because form-data sends arrays as strings, we preprocess and parse it
        variants: z.preprocess(
            (val) => {
                if (typeof val === "string") {
                    try {
                        return JSON.parse(val);
                    } catch (e) {
                        return val; // Let Zod fail the array check if it's invalid JSON
                    }
                }
                return val;
            },
            z.array(variantSchema).min(1, { error: "At least one variant is required" })
        ),
    }),
});

export const updateProductSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        status: z.enum([ProductStatus.ACTIVE, ProductStatus.ARCHIVED]).optional(),
    }),
});

export const addVariantSchema = z.object({
    body: variantSchema,
});

export const adjustStockSchema = z.object({
    body: z.object({
        quantity: z.number().int().refine((val) => val !== 0, { error: "Quantity cannot be zero" }),
        reason: z.string().min(2, { error: "Reason is required for stock adjustment" }),
    }),
});

export const updateVariantSchema = z.object({
    body: z.object({
        sku: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        price: z.coerce.number().positive({ error: "Price must be positive" }).optional(),
        // Note: We don't allow updating 'stock' here. 
        // Stock must be updated via the 'adjustStock' endpoint to ensure it's logged in StockMovement.
    }),
});

export const setPrimaryImageSchema = z.object({
    body: z.object({
        isPrimary: z.boolean(),
    }),
});

export const getProductsQuerySchema = z.object({
    query: z.object({
        search: z.string().optional(),
        status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
        includeDeleted: z.preprocess(
            (val) => val === "true" || val === true,
            z.boolean().optional().default(false)
        ),
    }),
});