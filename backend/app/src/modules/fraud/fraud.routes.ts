import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { manualFraudCheck } from "./fraud.controller.js";
import { Role } from "../../../generated/prisma/enums.js";

const router = Router();

router.use(protect);
router.use(resolveBusiness);

router.post(
    "/check",
    requireRole([Role.OWNER, Role.MANAGER, Role.STAFF]),
    manualFraudCheck
);

export default router;