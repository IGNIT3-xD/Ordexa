import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import {
    listSubmissions,
    getSubmission,
    rejectSubmission,
    convertToOrder,
    updateSubmissionStatus,
} from "./submission.controller.js";
import { getSubmissionsQuerySchema, rejectSubmissionSchema, updateSubmissionStatusSchema } from "./submission.schema.js";
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

// View submissions (Anyone in the business can view)
router.get("/", validate(getSubmissionsQuerySchema), listSubmissions);
router.get("/:submissionId", getSubmission);

// Convert submission to Order
router.post("/:submissionId/convert", requireRole([Role.OWNER, Role.MANAGER]), convertToOrder);

// Reject or Restore submission status
router.patch(
    "/:submissionId/status",
    requireRole([Role.OWNER, Role.MANAGER]),
    validate(updateSubmissionStatusSchema),
    updateSubmissionStatus
);

export default router;