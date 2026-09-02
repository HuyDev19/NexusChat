import express from "express";
import { submitReview, getApprovedReviews } from "../controllers/reviewController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getApprovedReviews); // Public: Get reviews for Landing Page
router.post("/", protectedRoute, submitReview); // Protected: Submit review

export default router;
