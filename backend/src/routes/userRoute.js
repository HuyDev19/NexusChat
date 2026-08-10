import express from "express";
import { authMe, searchUserByUsername, updateMe, uploadAvatar, getUserProfile, lockConversation, verifyLock, resetLock, blockUser, unblockUser } from "../controllers/userController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

const router = express.Router();

router.get("/search", searchUserByUsername);

router.get("/me", authMe);
router.put("/me", updateMe);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

router.post("/lock-conversation/:conversationId", protectedRoute, lockConversation);
router.post("/verify-lock/:conversationId", protectedRoute, verifyLock);
router.post("/reset-lock/:conversationId", protectedRoute, resetLock);

router.post("/:id/block", protectedRoute, blockUser);
router.post("/:id/unblock", protectedRoute, unblockUser);

router.get("/:id", getUserProfile);

export default router;
