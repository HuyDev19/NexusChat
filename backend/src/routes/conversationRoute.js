import express from "express";
import {
  createConversation,
  markConversationAsSeen,
  getConversations,
  getMessages,
  getPinnedMessages,
  searchMessages,
  updateWallpaper,
  updateNickname,
  addGroupMembers,
  removeGroupMember,
  updateGroupRole,
  updateGroupInfo,
  updateGroupAvatar,
  removeGroupAvatar,
  deleteConversation,
  clearChatHistory,
  leaveGroup,
  summarizeConversation,
  createChannel,
  joinChannel,
  updateChannelVisibility,
  explorePublicChannels,
  banGroupMember,
  getChannelPreview,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";
import { aiRateLimiterMiddleware } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.post("/channel", createChannel);
router.get("/channels/explore", explorePublicChannels);
router.get("/preview/:id", getChannelPreview);
router.post("/:id/join", joinChannel);
router.patch("/:id/visibility", updateChannelVisibility);

router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.get("/:conversationId/messages/pinned", getPinnedMessages);
router.get("/:conversationId/messages/search", searchMessages);
router.patch("/:conversationId/seen", markConversationAsSeen);
router.post("/:id/wallpaper", upload.single("image"), updateWallpaper);
router.post("/:id/nickname", updateNickname);

router.post("/:id/members", addGroupMembers);
router.delete("/:id/members/:memberId", removeGroupMember);
router.post("/:id/members/ban", banGroupMember);
router.patch("/:id/role", updateGroupRole);
router.patch("/:id/info", updateGroupInfo);
router.post("/:id/avatar", upload.single("avatar"), updateGroupAvatar);
router.delete("/:id/avatar", removeGroupAvatar);
router.delete("/:id", deleteConversation);
router.post("/:id/clear", clearChatHistory);
router.post("/:id/leave", leaveGroup);
router.get("/:id/summarize", aiRateLimiterMiddleware, summarizeConversation);

export default router;