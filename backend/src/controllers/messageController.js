import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import cloudinary from "../libs/cloudinary.js";
import fs from "fs";
import { handleAIResponse } from "../services/aiService.js";
import { NEXUS_AI_ID } from "../utils/seedNexusAI.js";
import { translate } from "@vitalets/google-translate-api";
import { uploadFileToDrive } from "../services/driveService.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, audioUrl, expiresIn, isViewOnce, mentions, replyTo, isForwarded, fileUrl, fileName, fileSize, sharedContactId } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content && !audioUrl && !req.body.imgUrl && !fileUrl && !sharedContactId) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc file đính kèm" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [senderId, new mongoose.Types.ObjectId(recipientId)] }
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    let finalExpiresAt = null;
    let finalExpiresIn = expiresIn;

    if (conversation.incognitoMode && conversation.incognitoMode.isActive) {
      if (new Date() > new Date(conversation.incognitoMode.expiresAt)) {
        // Mode expired, turn off
        conversation.incognitoMode.isActive = false;
        conversation.incognitoMode.expiresAt = null;
        conversation.incognitoMode.startedAt = null;
        conversation.incognitoMode.startedBy = null;
      } else {
        finalExpiresAt = conversation.incognitoMode.expiresAt;
        finalExpiresIn = null; // override
      }
    }

    if (!finalExpiresAt && finalExpiresIn) {
      finalExpiresAt = new Date(Date.now() + finalExpiresIn * 1000);
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
      audioUrl,
      imgUrl: req.body.imgUrl,
      expiresIn: finalExpiresIn,
      expiresAt: finalExpiresAt,
      isViewOnce,
      mentions,
      replyTo,
      isForwarded,
      fileUrl,
      fileName,
      fileSize,
      sharedContact: sharedContactId,
    });

    await updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    await message.populate("replyTo", "content senderId imgUrl audioUrl isRecalled");
    if (sharedContactId) {
      await message.populate("sharedContact", "_id displayName username avatarUrl");
    }

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("new-message", {
          message,
          conversation,
          unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
        });
      });
    }

    if (content?.includes("@NexusAI") || (mentions && mentions.includes(NEXUS_AI_ID))) {
      handleAIResponse(conversation._id, io, senderId);
    }

    return res.status(201).json({ message, conversation });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, audioUrl, imgUrl, expiresIn, isViewOnce, poll, mentions, replyTo, isForwarded, fileUrl, fileName, fileSize, sharedContactId } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !audioUrl && !imgUrl && !poll && !fileUrl && !sharedContactId) {
      return res.status(400).json("Thiếu nội dung hoặc file đính kèm hoặc bình chọn");
    }

    if (conversation.type === "channel") {
      const userParticipant = conversation.participants.find(p => p.userId.toString() === senderId.toString());
      if (userParticipant && userParticipant.role === "member") {
        return res.status(403).json({ message: "Chỉ quản trị viên mới có thể gửi tin nhắn vào kênh này" });
      }
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      audioUrl,
      imgUrl,
      expiresIn,
      isViewOnce,
      poll,
      mentions,
      replyTo,
      isForwarded,
      fileUrl,
      fileName,
      fileSize,
      sharedContact: sharedContactId,
    });

    await updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    await message.populate("replyTo", "content senderId imgUrl audioUrl isRecalled");
    if (sharedContactId) {
      await message.populate("sharedContact", "_id displayName username avatarUrl");
    }

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("new-message", {
          message,
          conversation,
          unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
        });
      });
    }

    if (content?.includes("@NexusAI") || (mentions && mentions.includes(NEXUS_AI_ID))) {
      handleAIResponse(conversation._id, io, senderId);
    }

    return res.status(201).json({ message, conversation });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAudio = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "nexuschat_audio",
      resource_type: "video",
    });

    fs.unlinkSync(file.path);

    return res.status(200).json({
      audioUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Lỗi khi upload audio:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Lỗi hệ thống khi tải file lên" });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "nexuschat_images",
      resource_type: "image",
    });

    fs.unlinkSync(file.path);

    return res.status(200).json({
      imgUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Lỗi khi upload image:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Lỗi hệ thống khi tải file lên" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ message: "Thiếu emoji" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Toggle off
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change emoji
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:react", {
            messageId,
            reactions: message.reactions,
            conversationId: conversation._id,
          });
        });
      }
    }

    return res.status(200).json({ message: "Thành công", reactions: message.reactions });
  } catch (error) {
    console.error("Lỗi khi thả cảm xúc:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation && conversation.type === "channel") {
      const userId = req.user._id;
      const userParticipant = conversation.participants.find(p => p.userId.toString() === userId.toString());
      if (userParticipant && userParticipant.role === "member") {
        return res.status(403).json({ message: "Chỉ quản trị viên mới có thể ghim tin nhắn trong kênh" });
      }
    }

    if (!message.isPinned) {
      const pinnedCount = await Message.countDocuments({
        conversationId: message.conversationId,
        isPinned: true,
      });
      if (pinnedCount >= 3) {
        return res.status(400).json({ message: "Bạn chỉ có thể ghim tối đa 3 tin nhắn." });
      }
    }

    message.isPinned = !message.isPinned;
    await message.save();


    if (conversation) {
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:pin", {
            messageId,
            isPinned: message.isPinned,
            conversationId: conversation._id,
          });
        });
      }
    }

    return res.status(200).json({ message: "Thành công", isPinned: message.isPinned });
  } catch (error) {
    console.error("Lỗi khi ghim tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const markMediaAsViewed = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    if (!message.isViewOnce) return res.status(400).json({ message: "Không phải tin nhắn xem một lần" });

    if (!message.viewedBy.includes(userId)) {
      message.viewedBy.push(userId);
      await message.save();
    }

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:update", {
            messageId,
            conversationId: conversation._id,
            updates: { viewedBy: message.viewedBy }
          });
        });
      }
    }

    return res.status(200).json({ message: "Thành công", viewedBy: message.viewedBy });
  } catch (error) {
    console.error("Lỗi khi đánh dấu xem ảnh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const recallMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền thu hồi tin nhắn này" });
    }

    if (message.isRecalled) {
      return res.status(400).json({ message: "Tin nhắn đã được thu hồi" });
    }

    // Delete media from cloudinary if present
    if (message.imgUrl) {
      const publicId = message.imgUrl.split("/").pop().split(".")[0];
      if (publicId) await cloudinary.uploader.destroy(`nexuschat_images/${publicId}`, { resource_type: "image" }).catch(() => { });
    }
    if (message.audioUrl) {
      const publicId = message.audioUrl.split("/").pop().split(".")[0];
      if (publicId) await cloudinary.uploader.destroy(`nexuschat_audio/${publicId}`, { resource_type: "video" }).catch(() => { });
    }

    message.isRecalled = true;
    message.content = undefined;
    message.imgUrl = undefined;
    message.audioUrl = undefined;

    if (message.gameEvent && message.gameEvent.gameId) {
      const Game = (await import("../models/Game.js")).default;
      await Game.findByIdAndDelete(message.gameEvent.gameId);
      message.gameEvent = undefined; // Xóa luôn data game khỏi tin nhắn
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      if (conversation.lastMessage && conversation.lastMessage._id && conversation.lastMessage._id.toString() === messageId.toString()) {
        conversation.lastMessage.content = "Tin nhắn đã bị thu hồi";
        await conversation.save();
      }

      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:update", {
            messageId,
            conversationId: conversation._id,
            updates: {
              isRecalled: true,
              content: undefined,
              imgUrl: undefined,
              audioUrl: undefined
            }
          });
        });
      }
    }

    return res.status(200).json({ message: "Thu hồi tin nhắn thành công" });
  } catch (error) {
    console.error("Lỗi khi thu hồi tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const voteOnPoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    if (optionIndex === undefined) return res.status(400).json({ message: "Thiếu lựa chọn vote" });

    const message = await Message.findById(messageId);
    if (!message || !message.poll) return res.status(404).json({ message: "Không tìm thấy bình chọn" });

    if (optionIndex < 0 || optionIndex >= message.poll.options.length) {
      return res.status(400).json({ message: "Lựa chọn không hợp lệ" });
    }

    // Remove user's vote from all other options (single choice logic)
    if (!message.poll.allowMultiple) {
      message.poll.options.forEach((opt, idx) => {
        if (idx !== optionIndex) {
          opt.votes = opt.votes.filter((id) => id.toString() !== userId.toString());
        }
      });
    }

    const targetOption = message.poll.options[optionIndex];
    const hasVoted = targetOption.votes.some((id) => id.toString() === userId.toString());

    if (hasVoted) {
      // Toggle off if they click again
      targetOption.votes = targetOption.votes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Add vote
      targetOption.votes.push(userId);
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:update", {
            messageId,
            conversationId: conversation._id,
            updates: { poll: message.poll }
          });
        });
      }
    }

    return res.status(200).json({ message: "Bình chọn thành công", poll: message.poll });
  } catch (error) {
    console.error("Lỗi khi vote bình chọn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const translateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { targetLang = "vi" } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (!message.content) return res.status(400).json({ message: "Tin nhắn không có nội dung để dịch" });

    const result = await translate(message.content, { to: targetLang });
    return res.status(200).json({ translatedContent: result.text });
  } catch (error) {
    console.error("Lỗi khi dịch tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi dịch" });
  }
};

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    // Fix multer encoding for originalname (HTTP headers are latin1 by default)
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const fileData = await uploadFileToDrive(file);

    return res.status(200).json(fileData);
  } catch (error) {
    console.error("Lỗi khi upload file:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tải file lên" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) return res.status(400).json({ message: "Thiếu nội dung tin nhắn" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Không có quyền chỉnh sửa tin nhắn này" });
    }

    if (message.isRecalled) {
      return res.status(400).json({ message: "Không thể chỉnh sửa tin nhắn đã thu hồi" });
    }
    
    if (message.expiresIn) {
      return res.status(400).json({ message: "Không thể chỉnh sửa tin nhắn tự hủy" });
    }
    
    if (message.isViewOnce) {
      return res.status(400).json({ message: "Không thể chỉnh sửa tin nhắn xem một lần" });
    }

    // Save current content to history
    message.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });

    message.content = content;
    message.isEdited = true;

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      // Update lastMessage if it matches the edited message
      if (conversation.lastMessage && conversation.lastMessage._id && conversation.lastMessage._id.toString() === messageId.toString()) {
        conversation.lastMessage.content = content;
        await conversation.save();
      }

      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:update", {
            messageId,
            conversationId: conversation._id,
            updates: {
              content: message.content,
              isEdited: message.isEdited,
              editHistory: message.editHistory,
            }
          });
        });
      }
    }

    return res.status(200).json({ message: "Chỉnh sửa tin nhắn thành công", data: message });
  } catch (error) {
    console.error("Lỗi khi chỉnh sửa tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi chỉnh sửa tin nhắn" });
  }
};