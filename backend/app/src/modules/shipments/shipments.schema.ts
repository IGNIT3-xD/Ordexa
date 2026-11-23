import { z } from "zod";
import { ShipmentStatus } from "../../../generated/prisma/enums.js";

export const getShipmentsQuerySchema = z.object({
    query: z.object({
        status: z.enum(ShipmentStatus).optional(),
        search: z.string().optional(),
        page: z.preprocess((val) => Number(val) || 1, z.number().int().positive()),
        limit: z.preprocess((val) => Number(val) || 10, z.number().int().positive().max(50)),
    }),
});