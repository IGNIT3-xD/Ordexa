import { Router } from "express";
import { protect } from "../../../middleware/auth.middleware.js";
import { resolveBusiness } from "../../../middleware/tenant.middleware.js";
import { connectMeta, metaCallback } from "./meta.controller.js";
import { handleWebhook, verifyWebhook } from "./webhook.controller.js";
import { notificationQueue } from "../../../lib/queue.js";

const router = Router();

// The callback comes from Facebook (no auth cookie), so it's public
router.get("/callback", metaCallback);

// The connect route requires the seller to be logged in
router.get("/connect", protect, resolveBusiness, connectMeta);

router.get("/webhook", verifyWebhook);
router.post("/webhook", handleWebhook);

router.post("/test-notification", protect, resolveBusiness, async (req, res) => {
    const { psid } = req.body;

    await notificationQueue.add("send-message", {
        businessId: req.tenant!.businessId,
        orderId: "test_order_123",
        psid: psid,
        template: "order_confirmed_update",
        variables: ["Rahim", "ORD-123", "https://ordexa.com/track/123"]
    });

    res.json({ message: "Notification job queued" });
});

export default router;