import { z } from "zod";
import { OrderSubmissionStatus } from "../../../generated/prisma/enums.js";

export const getSubmissionsQuerySchema = z.object({
    query: z.object({
        status: z.enum(OrderSubmissionStatus).optional(),
        page: z.preprocess((val) => Number(val) || 1, z.number().int().positive()),
        limit: z.preprocess((val) => Number(val) || 10, z.number().int().positive().max(50)),
    }),
});

export const rejectSubmissionSchema = z.object({
    body: z.object({
        reason: z.string().min(2, { error: "Reason must be at least 2 characters" }),
    }),
});

export const updateSubmissionStatusSchema = z.object({
    body: z.object({
        status: z.enum([OrderSubmissionStatus.PENDING, OrderSubmissionStatus.REJECTED]),
        rejectionReason: z.string().optional(),
    }),
});