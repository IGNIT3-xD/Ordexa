import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { bookShipment, listShipments, getShipment, retryShipment, getPublicTracking } from "./shipments.controller.js";
import { getShipmentsQuerySchema } from "./shipments.schema.js";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.middleware.js";

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

export const publicShipmentRouter = Router();
publicShipmentRouter.get("/:token", getPublicTracking);

export default router;