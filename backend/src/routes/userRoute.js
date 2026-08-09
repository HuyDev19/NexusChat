import express from "express";
import { authMe, searchUserByUsername, updateMe, uploadAvatar, getUserProfile } from "../controllers/userController.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/search", searchUserByUsername);

router.get("/me", authMe);
router.put("/me", updateMe);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

router.get("/:id", getUserProfile);

export default router;
