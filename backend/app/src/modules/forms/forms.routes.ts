import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import {
    createForm,
    listForms,
    generateToken,
    getPublicForm,
    submitOrder,
} from "./forms.controller.js";
import { createFormSchema, submitOrderSchema } from "./forms.schema.js";
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

// --- DASHBOARD ROUTES (Protected) ---
export const dashboardFormRouter = Router();
dashboardFormRouter.use(protect);
dashboardFormRouter.use(resolveBusiness);

dashboardFormRouter.post("/", requireRole([Role.OWNER, Role.MANAGER]), validate(createFormSchema), createForm);
dashboardFormRouter.get("/", listForms);
dashboardFormRouter.post("/:formId/tokens", requireRole([Role.OWNER, Role.MANAGER]), generateToken);

// --- PUBLIC ROUTES (Open to the world) ---
export const publicFormRouter = Router();
publicFormRouter.get("/:token", getPublicForm);
publicFormRouter.post("/:token/submit", validate(submitOrderSchema), submitOrder);