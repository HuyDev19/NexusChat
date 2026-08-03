import express from "express";
import {
  createConversation,
  markConversationAsSeen,
  getConversations,
  getMessages,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markConversationAsSeen);

export default router;