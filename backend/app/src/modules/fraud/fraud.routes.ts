import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { manualFraudCheck } from "./fraud.controller.js";
import { Role } from "../../../generated/prisma/enums.js";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { fraudCheckSchema } from "./fraud.schema.js";

const fraudLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        status: "error",
        message: "Too many fraud checks. Please wait a minute before trying again.",
    },
});

const router = Router();

router.use(protect);
router.use(resolveBusiness);

router.post(
    "/check",
    requireRole([Role.OWNER, Role.MANAGER, Role.STAFF]),
    fraudLimiter,
    validate(fraudCheckSchema),
    manualFraudCheck
);

export default router;