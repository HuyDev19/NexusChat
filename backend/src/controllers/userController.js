import User from "../models/User.js";
import cloudinary from "../libs/cloudinary.js";
import fs from "fs";
import bcrypt from "bcrypt";
import Otp from "../models/Otp.js";
import Session from "../models/Session.js";

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
    const query = String(req.query.username || "").trim();

    if (!query) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: `^${escapeRegExp(query.toLowerCase())}`, $options: "i" } },
        { displayName: { $regex: escapeRegExp(query), $options: "i" } }
      ]
    })
    .select("_id username displayName avatarUrl coverUrl note bio phone")
    .limit(20);

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ users });
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

    const user = await User.findById(id).select("_id username displayName email avatarUrl coverUrl note bio phone gender dob presenceStatus lastActiveAt createdAt photos");

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

export const removeAvatar = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (user.avatarId) {
      await cloudinary.uploader.destroy(user.avatarId);
    }

    user.avatarUrl = null;
    user.avatarId = null;
    await user.save();

    req.app.get("io").emit("user:updated", user);

    return res.status(200).json({ message: "Đã gỡ ảnh đại diện" });
  } catch (error) {
    console.error("Lỗi khi gỡ avatar:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi gỡ ảnh" });
  }
};

export const uploadCover = async (req, res) => {
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
      folder: "nexuschat_covers",
      transformation: [{ width: 1200, height: 400, crop: "fill" }],
    });

    // Delete old cover from Cloudinary if exists
    if (user.coverId) {
      await cloudinary.uploader.destroy(user.coverId);
    }

    user.coverUrl = result.secure_url;
    user.coverId = result.public_id;
    await user.save();

    req.app.get("io").emit("user:updated", user);

    return res.status(200).json({
      coverUrl: user.coverUrl,
      coverId: user.coverId,
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh bìa:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tải ảnh lên" });
  }
};

export const updateNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const { content, expiresInHours = 24 } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (!content) {
      user.note = { content: "", expiresAt: null };
    } else {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      user.note = { content, expiresAt };
    }
    
    await user.save();

    req.app.get("io").emit("user:updated", user);

    return res.status(200).json({ note: user.note });
  } catch (error) {
    console.error("Lỗi khi cập nhật ghi chú:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
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

export const changePasswordWithOtp = async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email;
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({ message: "Thiếu mã OTP hoặc mật khẩu mới" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({ email: emailTrimmed, otp, type: "change_password" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = hashedPassword;
    await user.save();

    await Otp.deleteMany({ email: emailTrimmed, type: "change_password" });

    return res.status(200).json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đổi mật khẩu" });
  }
};

export const deleteAccountWithOtp = async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "Vui lòng nhập mã OTP xác thực" });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({ email: emailTrimmed, otp, type: "delete_account" });
    if (!otpRecord) {
      return res.status(400).json({ message: "Mã OTP không chính xác hoặc đã hết hạn" });
    }

    // Xoá hoàn toàn User khỏi MongoDB -> Giải phóng email và username
    await User.deleteOne({ _id: userId });
    // Xoá tất cả phiên làm việc
    await Session.deleteMany({ userId });
    // Xoá OTP
    await Otp.deleteMany({ email: emailTrimmed, type: "delete_account" });

    return res.status(200).json({ message: "Đã xoá tài khoản thành công" });
  } catch (error) {
    console.error("Lỗi khi xoá tài khoản:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xoá tài khoản" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("blockedUsers", "displayName avatarUrl username");
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    
    return res.status(200).json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Lỗi lấy danh sách block:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleReadReceipts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { enabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    user.readReceipts = enabled;
    await user.save();

    req.app.get("io").emit("user:updated", user);

    return res.status(200).json({ readReceipts: user.readReceipts });
  } catch (error) {
    console.error("Lỗi khi cập nhật read receipts:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const addProfilePhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;
    const { caption } = req.body;

    if (!file) {
      return res.status(400).json({ message: "Vui lòng chọn hình ảnh để tải lên" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // Upload to cloudinary
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "nexuschat_profile_photos",
      transformation: [{ width: 1200, crop: "limit" }],
    });

    const newPhoto = {
      url: result.secure_url,
      publicId: result.public_id,
      caption: caption || "",
      createdAt: new Date(),
      reactions: []
    };

    if (!user.photos) user.photos = [];
    user.photos.unshift(newPhoto);
    await user.save();

    req.app.get("io").emit("user:photo-added", { userId: user._id, photo: newPhoto });

    return res.status(201).json({ message: "Đã thêm ảnh thành công", photo: newPhoto, photos: user.photos });
  } catch (error) {
    console.error("Lỗi khi thêm ảnh hồ sơ:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tải ảnh" });
  }
};

export const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const { photoId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const photoIndex = (user.photos || []).findIndex((p) => p._id.toString() === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy ảnh" });
    }

    const photo = user.photos[photoIndex];
    if (photo.publicId) {
      try {
        await cloudinary.uploader.destroy(photo.publicId);
      } catch (err) {
        console.error("Lỗi xóa ảnh Cloudinary:", err);
      }
    }

    user.photos.splice(photoIndex, 1);
    await user.save();

    req.app.get("io").emit("user:photo-deleted", { userId: user._id, photoId });

    return res.status(200).json({ message: "Đã xóa ảnh thành công", photos: user.photos });
  } catch (error) {
    console.error("Lỗi khi xóa ảnh hồ sơ:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa ảnh" });
  }
};

export const reactProfilePhoto = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId, photoId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Thiếu biểu cảm emoji" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const photo = (targetUser.photos || []).find((p) => p._id.toString() === photoId);
    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh" });
    }

    if (!photo.reactions) photo.reactions = [];

    const existingReactionIndex = photo.reactions.findIndex(
      (r) => r.userId.toString() === currentUserId.toString()
    );

    if (existingReactionIndex > -1) {
      if (photo.reactions[existingReactionIndex].emoji === emoji) {
        // Remove reaction (toggle off)
        photo.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change emoji
        photo.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      photo.reactions.push({
        userId: currentUserId,
        emoji,
      });
    }

    targetUser.markModified("photos");
    await targetUser.save();

    req.app.get("io").emit("user:photo-reacted", {
      userId: targetUser._id,
      photoId,
      reactions: photo.reactions
    });

    return res.status(200).json({
      message: "Cập nhật cảm xúc thành công",
      reactions: photo.reactions,
      photos: targetUser.photos
    });
  } catch (error) {
    console.error("Lỗi khi tương tác cảm xúc ảnh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tương tác ảnh" });
  }
};

