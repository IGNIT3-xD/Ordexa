import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import { connectCourier, getConnections } from "./courier.controller.js";
import { connectCourierSchema } from "./courier.schema.js";
import { Role } from "../../../generated/prisma/enums.js";

const validate = (schema: any) => (req: any, res: any, next: any) => {
    const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });

    if (parsed.body)
        req.body = parsed.body;

    next();
};

const router = Router();
router.use(protect);
router.use(resolveBusiness);

router.get("/", getConnections);
router.post("/", requireRole([Role.OWNER]), validate(connectCourierSchema), connectCourier);

export default router;