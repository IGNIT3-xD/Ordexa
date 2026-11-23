import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { WebhookService } from "./webhook.service.js";

export const steadfastWebhook = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;

    await WebhookService.handleSteadfastUpdate(payload);

    res.status(200).json({ status: "success" });
});