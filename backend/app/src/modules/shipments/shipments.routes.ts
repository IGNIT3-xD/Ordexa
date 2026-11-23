import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { bookShipment, listShipments, getShipment, retryShipment } from "./shipments.controller.js";
import { getShipmentsQuerySchema } from "./shipments.schema.js";
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

// List and Get Shipments
router.get("/", validate(getShipmentsQuerySchema), listShipments);
router.get("/:shipmentId", getShipment);

// Book Shipment
router.post("/orders/:orderId", requireRole([Role.OWNER, Role.MANAGER]), bookShipment);
router.post(
    "/:shipmentId/retry",
    requireRole([Role.OWNER, Role.MANAGER]),
    retryShipment
);

export default router;