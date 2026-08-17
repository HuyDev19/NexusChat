import express from "express";
import {
  refreshToken,
  signIn,
  signOut,
  signUp,
  sendOtp,
  verifyOtp,
  resetPassword,
  checkUsername,
  checkEmail,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/check-username", checkUsername);
router.post("/check-email", checkEmail);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signUp);
router.post("/reset-password", resetPassword);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.post("/refresh", refreshToken);

export default router;
