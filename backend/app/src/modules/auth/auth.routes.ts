import { Router } from "express";
import multer from "multer";
import { register, login, verifyEmail, logout, refresh, forgotPassword, verifyResetCode, resetPassword } from "./auth.controller.js";
import { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema } from "./auth.schema.js";
import { strictLimiter, registerLimiter } from "../../middleware/rateLimiter.js";
import { verifyResetToken } from "../../middleware/verifyResetToken.js";
import { validate } from "../../middleware/validate.middleware.js";
import { secureUpload } from "../../middleware/upload.middleware.js";

const router = Router();

router.post("/register", registerLimiter, secureUpload.single("profilePic"), validate(registerSchema), register);
router.post("/verify-email", strictLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/login", strictLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", refresh);

router.post("/forgot-password", strictLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-code", strictLimiter, validate(verifyResetCodeSchema), verifyResetCode);
router.post("/reset-password", strictLimiter, verifyResetToken, validate(resetPasswordSchema), resetPassword);

export default router;