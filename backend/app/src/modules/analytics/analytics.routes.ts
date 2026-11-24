import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness } from "../../middleware/tenant.middleware.js";
import {
    getOverview,
    getSalesChart,
    getTopProducts,
    getLowStock
} from "./analytics.controller.js";

const router = Router();

router.use(protect);
router.use(resolveBusiness);

// All roles (Owner, Manager, Staff) can view analytics
router.get("/overview", getOverview);
router.get("/sales-chart", getSalesChart);
router.get("/top-products", getTopProducts);
router.get("/low-stock", getLowStock);

export default router;