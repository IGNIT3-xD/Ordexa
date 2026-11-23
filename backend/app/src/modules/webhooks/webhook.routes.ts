import { Router } from "express";
import { steadfastWebhook } from "./webhook.controller.js";

const router = Router();

router.post("/steadfast", steadfastWebhook);

export default router;