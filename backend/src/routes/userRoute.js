import express from "express";
import {
  authMe,
  searchUserByUsername,
  updateMe,
  uploadAvatar,
  removeAvatar,
  uploadCover,
  updateNote,
  getUserProfile,
  lockConversation,
  verifyLock,
  resetLock,
  blockUser,
  unblockUser,
  changePasswordWithOtp,
  deleteAccountWithOtp,
  getBlockedUsers,
  toggleReadReceipts,
} from "../controllers/userController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

const router = express.Router();

router.get("/search", searchUserByUsername);

router.get("/me", authMe);
router.put("/me", updateMe);
router.delete("/me", protectedRoute, deleteAccountWithOtp);
router.post("/change-password", protectedRoute, changePasswordWithOtp);
router.get("/me/blocked", protectedRoute, getBlockedUsers);
router.put("/read-receipts", protectedRoute, toggleReadReceipts);

router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.delete("/avatar", protectedRoute, removeAvatar);
router.post("/uploadCover", upload.single("file"), uploadCover);
router.put("/note", protectedRoute, updateNote);

router.post("/lock-conversation/:conversationId", protectedRoute, lockConversation);
router.post("/verify-lock/:conversationId", protectedRoute, verifyLock);
router.post("/reset-lock/:conversationId", protectedRoute, resetLock);

router.post("/:id/block", protectedRoute, blockUser);
router.post("/:id/unblock", protectedRoute, unblockUser);

router.get("/:id", getUserProfile);

export default router;
