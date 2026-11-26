import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import {
    createBusiness,
    listMyBusinesses,
    getCurrentBusiness,
    updateBusiness,
    getMembers,
    deleteBusiness,
    inviteUser,
    acceptInvite,
    updateMemberRole,
    removeMember,
} from "./business.controller.js";
import { createBusinessSchema, inviteUserSchema, updateBusinessSchema, updateMemberRoleSchema } from "./business.schema.js";
import { Role } from "../../../generated/prisma/enums.js";
import { validate } from "../../middleware/validate.middleware.js";

const router = Router();

// All business routes require a logged-in user
router.use(protect);

// Routes that DON'T need a specific business selected
router.post("/", validate(createBusinessSchema), createBusiness);
router.get("/", listMyBusinesses);

// Routes that DO require an active business (identified by x-business-id header)
router.get("/current", resolveBusiness, getCurrentBusiness);
router.patch("/current", resolveBusiness, requireRole([Role.OWNER, Role.MANAGER]), validate(updateBusinessSchema), updateBusiness);
router.get("/current/members", resolveBusiness, getMembers);
router.delete("/current", resolveBusiness, requireRole([Role.OWNER]), deleteBusiness);

router.post(
    "/current/invitations",
    resolveBusiness,
    requireRole([Role.MANAGER, Role.OWNER]),
    validate(inviteUserSchema),
    inviteUser
);

router.post("/invitations/accept", protect, acceptInvite);

router.patch(
    "/current/members/:memberId/role",
    resolveBusiness,
    requireRole([Role.OWNER]),
    validate(updateMemberRoleSchema),
    updateMemberRole
);

router.delete(
    "/current/members/:memberId",
    resolveBusiness,
    requireRole([Role.OWNER]),
    removeMember
);

export default router