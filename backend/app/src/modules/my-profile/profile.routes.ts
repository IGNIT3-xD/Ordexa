import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { getProfile, updateProfile, updateProfilePic, updatePassword } from "./profile.controller.js";
import { updateProfileSchema, updatePasswordSchema } from "./profile.schema.js";
import { validate } from "../../middleware/validate.middleware.js";
import { secureUpload } from "../../middleware/upload.middleware.js";

const router = Router();

// All routes in this file require the user to be logged in
router.use(protect);

router.get("/", getProfile);
router.patch("/", validate(updateProfileSchema), updateProfile);
router.patch("/profile-pic", secureUpload.single("profilePic"), updateProfilePic);
router.patch("/password", validate(updatePasswordSchema), updatePassword);

export default router;