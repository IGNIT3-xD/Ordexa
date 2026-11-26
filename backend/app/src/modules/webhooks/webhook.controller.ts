import crypto from "node:crypto";
import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/AppError.js";
import { WebhookService } from "./webhook.service.js";
import { env } from "../../config/env.js";

const timingSafeEqualString = (a: string, b: string): boolean => {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) return false;
    return crypto.timingSafeEqual(aBuffer, bBuffer);
};

export const steadfastWebhook = asyncHandler(async (req: Request, res: Response) => {
    const providedSecret = req.headers["x-webhook-secret"] as string | undefined;

    if (
        typeof providedSecret !== "string" ||
        !timingSafeEqualString(providedSecret, env.STEADFAST_WEBHOOK_SECRET)
    ) {
        console.warn("🚨 Unauthorized webhook attempt blocked. Missing or invalid header.");
        throw new ApiError(401, "Unauthorized webhook");
    }

    await WebhookService.handleSteadfastUpdate(req.body);

    res.status(200).json({ status: "success" });
});