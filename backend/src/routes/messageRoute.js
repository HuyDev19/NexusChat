import express from "express";
import multer from "multer";

import {
  sendDirectMessage,
  sendGroupMessage,
  uploadAudio,
  uploadImage,
  reactToMessage,
  pinMessage,
  markMediaAsViewed,
  recallMessage,
  voteOnPoll,
  translateMessage,
  uploadFile,
  editMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";

import {
  createScheduledMessage,
  getScheduledMessages,
  cancelScheduledMessage,
  updateScheduledMessage,
} from "../controllers/scheduledController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Scheduled Messages routes
router.post("/schedule", createScheduledMessage);
router.get("/scheduled", getScheduledMessages);
router.get("/scheduled/:conversationId", getScheduledMessages);
router.delete("/scheduled/:id", cancelScheduledMessage);
router.put("/scheduled/:id", updateScheduledMessage);

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.post("/upload-audio", upload.single("file"), uploadAudio);
router.post("/upload-image", upload.single("file"), uploadImage);
router.post("/upload-file", upload.single("file"), uploadFile);
router.post("/:messageId/react", reactToMessage);
router.post("/:messageId/pin", pinMessage);
router.post("/:messageId/view-media", markMediaAsViewed);
router.post("/:messageId/recall", recallMessage);
router.post("/:messageId/vote", voteOnPoll);
router.post("/:messageId/translate", translateMessage);
router.post("/:messageId/edit", editMessage);

export default router;