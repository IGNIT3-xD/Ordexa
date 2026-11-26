import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { checkout, paymentSuccess, paymentFail, paymentCancel, getSubscription } from "./billing.controller.js";
import { Role } from "../../../generated/prisma/enums.js";
import rateLimit from "express-rate-limit";

const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: "error", message: "Too many payment requests, please try again later." },
});

const failLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many requests" },
});

const router = Router();

// --- PUBLIC IPN ROUTES
router.post("/success", paymentLimiter, paymentSuccess);
router.post("/fail", failLimiter, paymentFail);
router.post("/cancel", failLimiter, paymentFail);

// --- PROTECTED ROUTES ---
router.use(protect);
router.use(resolveBusiness);

router.get("/", getSubscription);
router.post("/checkout", requireRole([Role.OWNER]), checkout);

export default router;