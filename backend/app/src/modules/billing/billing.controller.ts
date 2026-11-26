import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { BillingService } from "./billing.service.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const sub = await BillingService.getSubscription(req.tenant.businessId);

    res.json(sub);
});

export const checkout = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { plan } = req.body;

    const result = await BillingService.createCheckout(req.tenant.businessId, plan, {
        name: user.name || "Seller",
        email: user.email,
        phone: "",
    });

    res.json(result);
});

// SSLCommerz may post values as strings or (rarely) arrays.
const firstString = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
        return typeof value[0] === "string" ? value[0] : undefined;
    }
    return undefined;
};

const readField = (req: Request, field: string): string | undefined =>
    firstString(req.body?.[field]) ?? firstString(req.query?.[field]);

export const paymentSuccess = asyncHandler(async (req: Request, res: Response) => {
    const valId = readField(req, "val_id");
    const tranId = readField(req, "tran_id");

    if (!valId || !tranId) {
        return res.redirect(`${env.FRONTEND_URL}/dashboard/billing?status=failed`);
    }

    await BillingService.handlePaymentSuccess(valId, tranId);

    // Redirect the user to your frontend success page
    res.redirect(`${env.FRONTEND_URL}/dashboard/billing?status=success`);
});

export const paymentFail = asyncHandler(async (req: Request, res: Response) => {
    const tranId = readField(req, "tran_id");

    if (tranId) {
        await BillingService.markPaymentFailed(tranId);
    }

    res.redirect(`${env.FRONTEND_URL}/dashboard/billing?status=failed`);
});

export const paymentCancel = asyncHandler(async (req: Request, res: Response) => {
    const tranId = readField(req, "tran_id");

    if (tranId) {
        await BillingService.markPaymentFailed(tranId);
    }

    res.redirect(`${env.FRONTEND_URL}/dashboard/billing?status=cancelled`);
});