import express from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { inviteGame, joinGame, getGame } from "../controllers/gameController.js";

const router = express.Router();

router.post("/invite", protectedRoute, inviteGame);
router.post("/:gameId/join", protectedRoute, joinGame);
router.get("/:gameId", protectedRoute, getGame);

export default router;
