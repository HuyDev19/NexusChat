import express from "express";
import multer from "multer";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
  reactStory,
} from "../controllers/storyController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", protectedRoute, upload.single("file"), createStory);
router.get("/", protectedRoute, getStories);
router.post("/:id/view", protectedRoute, viewStory);
router.post("/:id/react", protectedRoute, reactStory);
router.delete("/:id", protectedRoute, deleteStory);

export default router;
