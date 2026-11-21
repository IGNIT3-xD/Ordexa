import { Router } from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.middleware.js";
import { getProfile, updateProfile, updateProfilePic, updatePassword } from "./profile.controller.js";
import { updateProfileSchema, updatePasswordSchema } from "./profile.schema.js";

const validate = (schema: any) => (req: any, res: any, next: any) => {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
};

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// All routes in this file require the user to be logged in
router.use(protect);

router.get("/", getProfile);
router.patch("/", validate(updateProfileSchema), updateProfile);
router.patch("/profile-pic", upload.single("profilePic"), updateProfilePic);
router.patch("/password", validate(updatePasswordSchema), updatePassword);

export default router;