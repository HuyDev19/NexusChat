import User from "../models/User.js";
import cloudinary from "../libs/cloudinary.js";
import fs from "fs";
import bcrypt from "bcrypt";

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
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "nexuschat_avatars",
      transformation: [{ width: 400, height: 400, crop: "fill" }],
    });

    // Delete old avatar from Cloudinary if exists
    if (user.avatarId) {
      await cloudinary.uploader.destroy(user.avatarId);
    }

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
    return res.status(500).json({ message: "Lỗi hệ thống khi tải ảnh lên" });
  }
};

export const lockConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { pin } = req.body;
    const userId = req.user._id;

    if (!pin) return res.status(400).json({ message: "Thiếu mã PIN" });

    const user = await User.findById(userId);
    const existingLockIndex = user.lockedConversations.findIndex(
      (l) => l.conversationId.toString() === conversationId
    );

    if (existingLockIndex !== -1) {
      user.lockedConversations[existingLockIndex].pin = pin;
    } else {
      user.lockedConversations.push({ conversationId, pin });
    }

    await user.save();
    return res.status(200).json({ message: "Thiết lập mã PIN thành công" });
  } catch (error) {
    console.error("Lỗi khi khóa cuộc trò chuyện:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const verifyLock = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { pin } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const lock = user.lockedConversations.find(
      (l) => l.conversationId.toString() === conversationId
    );

    if (!lock) return res.status(200).json({ success: true }); // Không có khóa

    if (lock.pin === pin) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: "Mã PIN không chính xác" });
    }
  } catch (error) {
    console.error("Lỗi khi xác thực mã PIN:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const resetLock = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { password, newPin } = req.body;
    const userId = req.user._id;

    if (!password) return res.status(400).json({ message: "Yêu cầu mật khẩu" });

    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(password, user.hashedPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    const existingLockIndex = user.lockedConversations.findIndex(
      (l) => l.conversationId.toString() === conversationId
    );

    if (newPin) {
      if (existingLockIndex !== -1) {
        user.lockedConversations[existingLockIndex].pin = newPin;
      } else {
        user.lockedConversations.push({ conversationId, pin: newPin });
      }
    } else {
      if (existingLockIndex !== -1) {
        user.lockedConversations.splice(existingLockIndex, 1);
      }
    }

    await user.save();
    return res.status(200).json({ message: "Đặt lại mã PIN thành công" });
  } catch (error) {
    console.error("Lỗi khi đặt lại mã PIN:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (id === userId.toString()) {
      return res.status(400).json({ message: "Không thể chặn chính mình" });
    }

    const user = await User.findById(userId);
    if (!user.blockedUsers.includes(id)) {
      user.blockedUsers.push(id);
      await user.save();
    }

    req.app.get("io").to(`user:${userId}`).emit("user:updated", user);

    return res.status(200).json({ message: "Đã chặn người dùng", blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Lỗi khi chặn người dùng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(uid => uid.toString() !== id);
    await user.save();

    req.app.get("io").to(`user:${userId}`).emit("user:updated", user);

    return res.status(200).json({ message: "Đã bỏ chặn người dùng", blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Lỗi khi bỏ chặn người dùng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
