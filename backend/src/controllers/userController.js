import User from "../models/User.js";
import cloudinary from "../libs/cloudinary.js";
import fs from "fs";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const authMe = async (req, res) => {
  try {
    const user = req.user; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const username = String(req.query.username || "")
      .trim()
      .toLowerCase();

    if (!username) {
      return res.status(400).json({ message: "Thiếu username để tìm kiếm" });
    }

    const user = await User.findOne({
      username: { $regex: `^${escapeRegExp(username)}`, $options: "i" },
    }).select("_id username displayName avatarUrl bio phone");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi tìm user theo username", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Thiếu ID người dùng" });
    }

    const user = await User.findById(id).select("_id displayName avatarUrl bio presenceStatus createdAt");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin profile người dùng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, phone, bio, presenceStatus } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { displayName, phone, bio, presenceStatus },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    req.app.get("io").emit("user:updated", updatedUser);

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin cá nhân:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "nexuschat_avatars",
      transformation: [{ width: 400, height: 400, crop: "fill" }],
    });

    // Delete old avatar from Cloudinary if exists
    if (user.avatarId) {
      await cloudinary.uploader.destroy(user.avatarId);
    }

    // Delete local file after upload
    fs.unlinkSync(file.path);

    user.avatarUrl = result.secure_url;
    user.avatarId = result.public_id;
    await user.save();

    req.app.get("io").emit("user:updated", user);

    return res.status(200).json({
      avatarUrl: user.avatarUrl,
      avatarId: user.avatarId,
    });
  } catch (error) {
    console.error("Lỗi khi upload avatar:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Lỗi hệ thống khi tải ảnh lên" });
  }
};
