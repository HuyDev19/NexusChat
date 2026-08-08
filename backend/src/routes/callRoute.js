import express from "express";
import { getCallToken } from "../controllers/callController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Chỉ cho phép user đã đăng nhập được lấy token tham gia phòng call
router.post("/token", protectedRoute, getCallToken);

export default router;
