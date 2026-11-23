import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { checkout, paymentSuccess, paymentFail, getSubscription } from "./billing.controller.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

// --- PUBLIC IPN ROUTES
router.post("/success", paymentSuccess);
router.post("/fail", paymentFail);

// --- PROTECTED ROUTES ---
router.use(protect);
router.use(resolveBusiness);

router.get("/", getSubscription);
router.post("/checkout", requireRole([Role.OWNER]), checkout);

export default router;