import express from "express";
import {
  createConversation,
  markConversationAsSeen,
  getConversations,
  getMessages,
  updateWallpaper,
  updateNickname,
  addGroupMembers,
  removeGroupMember,
  updateGroupRole,
  updateGroupInfo,
  updateGroupAvatar,
  deleteConversation,
  clearChatHistory,
  leaveGroup,
  summarizeConversation,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";
import { aiRateLimiterMiddleware } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markConversationAsSeen);
router.post("/:id/wallpaper", upload.single("image"), updateWallpaper);
router.post("/:id/nickname", updateNickname);

router.post("/:id/members", addGroupMembers);
router.delete("/:id/members/:memberId", removeGroupMember);
router.patch("/:id/role", updateGroupRole);
router.patch("/:id/info", updateGroupInfo);
router.post("/:id/avatar", upload.single("avatar"), updateGroupAvatar);
router.delete("/:id", deleteConversation);
router.post("/:id/clear", clearChatHistory);
router.post("/:id/leave", leaveGroup);
router.get("/:id/summarize", aiRateLimiterMiddleware, summarizeConversation);

export default router;