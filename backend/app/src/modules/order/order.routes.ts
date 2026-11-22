import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { listOrders, updateOrderStatus } from "./order.controller.js";
import { getOrdersQuerySchema, updateOrderStatusSchema } from "./order.schema.js";
import { Role } from "../../../generated/prisma/enums.js";

const validate = (schema: any) => (req: any, res: any, next: any) => {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });

    if (parsed.body)
        req.body = parsed.body;

    if (parsed.query)
        (req as any).validatedQuery = parsed.query;

    if (parsed.params)
        (req as any).validatedParams = parsed.params;

    next();
};

const router = Router();

router.use(protect);
router.use(resolveBusiness);

router.get("/", validate(getOrdersQuerySchema), listOrders);

router.patch(
    "/:orderId/status",
    requireRole([Role.OWNER, Role.MANAGER]),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

export default router;