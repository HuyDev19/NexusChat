import express from "express";
import { authMe, searchUserByUsername } from "../controllers/userController.js";

const router = express.Router();

router.get("/search", searchUserByUsername);

router.get("/me", authMe);

export default router;
