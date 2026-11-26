import { Router } from "express";
import rateLimit from "express-rate-limit";
import { steadfastWebhook } from "./webhook.controller.js";
import { steadfastWebhookSchema } from "./webhook.schema.js";
import { validate } from "../../middleware/validate.middleware.js";

const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { status: "error", message: "Too many webhook requests." },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

router.post("/steadfast", webhookLimiter, validate(steadfastWebhookSchema), steadfastWebhook);

export default router;
