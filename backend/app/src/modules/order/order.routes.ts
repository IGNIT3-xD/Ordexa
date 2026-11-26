import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { listOrders, updateOrderStatus } from "./order.controller.js";
import { getOrdersQuerySchema, updateOrderStatusSchema } from "./order.schema.js";
import { Role } from "../../../generated/prisma/enums.js";
import { enforceQuota } from "../../middleware/quota.middleware.js";
import { downloadInvoice } from "./public-invoice.controller.js";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";

const invoiceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Too many invoice requests, please try again later." },
});

const router = Router();

router.use(protect);
router.use(resolveBusiness);

router.get("/", validate(getOrdersQuerySchema), listOrders);

router.patch(
    "/:orderId/status",
    requireRole([Role.OWNER, Role.MANAGER]),
    enforceQuota,
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

export const invoiceRouter = Router();
invoiceRouter.get("/:token", invoiceLimiter, downloadInvoice);

export default router;