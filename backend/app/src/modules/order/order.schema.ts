import { z } from "zod";
import { OrderStatus } from "../../../generated/prisma/enums.js";

export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum([OrderStatus.CONFIRM, OrderStatus.CANCELLED]),
    }),
});

export const getOrdersQuerySchema = z.object({
    query: z.object({
        status: z.enum(OrderStatus).optional(),
        search: z.string().optional(),
        page: z.preprocess((val) => Number(val) || 1, z.number().int().positive()),
        limit: z.preprocess((val) => Number(val) || 10, z.number().int().positive().max(50)),
    }),
});