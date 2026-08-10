import express from "express";
import {
  createConversation,
  markConversationAsSeen,
  getConversations,
  getMessages,
  updateWallpaper,
  updateNickname,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import upload from "../middlewares/multerMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markConversationAsSeen);
router.post("/:id/wallpaper", upload.single("image"), updateWallpaper);
router.post("/:id/nickname", updateNickname);

export default router;