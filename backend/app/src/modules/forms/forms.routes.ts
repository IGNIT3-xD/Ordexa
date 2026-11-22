import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import {
    createForm,
    listForms,
    generateToken,
    getPublicForm,
    submitOrder,
    updateFormStatus,
} from "./forms.controller.js";
import { createFormSchema, submitOrderSchema, updateFormStatusSchema } from "./forms.schema.js";
import { Role } from "../../../generated/prisma/enums.js";
import rateLimit from "express-rate-limit";

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

const publicSubmitLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: "error", message: "Too many requests from this IP, please try again later." },
});

// --- DASHBOARD ROUTES (Protected) ---
export const dashboardFormRouter = Router();
dashboardFormRouter.use(protect);
dashboardFormRouter.use(resolveBusiness);

dashboardFormRouter.post("/", requireRole([Role.OWNER, Role.MANAGER]), validate(createFormSchema), createForm);
dashboardFormRouter.get("/", listForms);
dashboardFormRouter.post("/:formId/tokens", requireRole([Role.OWNER, Role.MANAGER]), generateToken);
dashboardFormRouter.patch(
    "/:formId/status",
    requireRole([Role.OWNER, Role.MANAGER]),
    validate(updateFormStatusSchema), updateFormStatus
);

// --- PUBLIC ROUTES (Open to the world) ---
export const publicFormRouter = Router();
publicFormRouter.get("/:token", getPublicForm);
publicFormRouter.post("/:token/submit", publicSubmitLimiter, validate(submitOrderSchema), submitOrder);