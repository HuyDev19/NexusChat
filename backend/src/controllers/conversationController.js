import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import cloudinary from "../libs/cloudinary.js";
import bcrypt from "bcrypt";
import { getEffectiveStreak } from "../utils/messageHelper.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, new mongoose.Types.ObjectId(participantId)] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId, role: "leader" }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
          voiceRooms: [{ name: "Phòng chung" }], // Phòng mặc định
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl coverUrl note presenceStatus" },
      {
        path: "seenBy",
        select: "displayName avatarUrl coverUrl note",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl coverUrl note" },
    ]);

    const formattedParticipants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      coverUrl: p.userId?.coverUrl ?? null,
      note: p.userId?.note,
      presenceStatus: p.userId?.presenceStatus ?? 'online',
      joinedAt: p.joinedAt,
      role: p.role,
    }));

    const formattedConversation = {
      ...conversation.toObject(),
      unreadCounts: conversation.unreadCounts || {},
      participants: formattedParticipants,
    };

    const io = req.app.get("io");
    if (io) {
      formattedConversation.participants.forEach((p) => {
        if (p._id.toString() !== userId.toString()) {
          io.to(`user:${p._id}`).emit("new-group", formattedConversation);
        }
      });
    }

    return res.status(201).json({ conversation: formattedConversation });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      "participants.userId": userId,
      type: { $ne: "community" },
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl coverUrl note presenceStatus lastActiveAt updatedAt",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl coverUrl note",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl coverUrl note",
      });

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        coverUrl: p.userId?.coverUrl ?? null,
        note: p.userId?.note,
        presenceStatus: p.userId?.presenceStatus ?? 'online',
        lastActiveAt: p.userId?.lastActiveAt || p.userId?.updatedAt || null,
        joinedAt: p.joinedAt,
        role: p.role,
      }));

      const nicknamesObj = convo.nicknames instanceof Map 
        ? Object.fromEntries(convo.nicknames) 
        : convo.nicknames || {};

      return {
        ...convo.toObject(),
        streak: getEffectiveStreak(convo.streak),
        unreadCounts: convo.unreadCounts || {},
        participants,
        nicknames: nicknamesObj,
      };
    }).filter(convo => {
      // Direct conversations are always kept so friends are never lost on reload
      if (convo.type === "direct") return true;

      // Ignore group conversations if cleared and no new messages
      if (convo.clearedAt && convo.clearedAt instanceof Map) {
        const clearedTime = convo.clearedAt.get(userId.toString());
        if (clearedTime && convo.lastMessageAt) {
          if (new Date(convo.lastMessageAt) <= new Date(clearedTime)) {
            return false;
          }
        }
      } else if (convo.clearedAt) {
        const clearedTime = convo.clearedAt[userId.toString()];
        if (clearedTime && convo.lastMessageAt) {
          if (new Date(convo.lastMessageAt) <= new Date(clearedTime)) {
            return false;
          }
        }
      }
      return true;
    });

    // Deduplicate direct conversations, keeping the one with the most recent lastMessageAt
    const directMap = new Map();
    const uniqueFormatted = [];

    formatted.forEach((convo) => {
      if (convo.type === "direct") {
        const otherUser = (convo.participants || []).find((p) => p._id && p._id.toString() !== userId.toString());
        if (otherUser) {
          const otherId = otherUser._id.toString();
          const existing = directMap.get(otherId);
          if (!existing) {
            directMap.set(otherId, convo);
          } else {
            const existingTime = existing.lastMessageAt ? new Date(existing.lastMessageAt).getTime() : 0;
            const currentTime = convo.lastMessageAt ? new Date(convo.lastMessageAt).getTime() : 0;
            if (currentTime > existingTime) {
              directMap.set(otherId, convo);
            }
          }
        } else {
          uniqueFormatted.push(convo);
        }
      } else {
        uniqueFormatted.push(convo);
      }
    });

    uniqueFormatted.push(...Array.from(directMap.values()));

    uniqueFormatted.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.status(200).json({ conversations: uniqueFormatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user._id;

    const query = { conversationId, deletedFor: { $ne: userId } };

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Security check: only participants can read messages
    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không có quyền xem cuộc trò chuyện này" });
    }
    let clearedTime = null;
    if (conversation.clearedAt && conversation.clearedAt.get) {
      clearedTime = conversation.clearedAt.get(userId.toString());
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    if (clearedTime) {
      query.createdAt = { ...query.createdAt, $gt: new Date(clearedTime) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1)
      .populate("replyTo", "content senderId imgUrl audioUrl fileUrl fileName isRecalled isViewOnce")
      .populate("sharedContact", "_id displayName username avatarUrl");

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt instanceof Date
        ? nextMessage.createdAt.toISOString()
        : new Date(nextMessage.createdAt).toISOString();
      messages.pop();
    }

    messages = messages.reverse().map(msg => {
      const msgObj = msg.toObject();
      if (msgObj.isViewOnce && msgObj.viewedBy && msgObj.viewedBy.some(id => id.toString() === userId.toString())) {
        msgObj.imgUrl = null;
        msgObj.audioUrl = null;
      }
      return msgObj;
    });

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không có quyền xem cuộc trò chuyện này" });
    }

    let clearedTime = null;
    if (conversation.clearedAt && conversation.clearedAt.get) {
      clearedTime = conversation.clearedAt.get(userId.toString());
    }

    const query = { conversationId, isPinned: true, deletedFor: { $ne: userId } };
    if (clearedTime) {
      query.createdAt = { $gt: new Date(clearedTime) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .populate("senderId", "displayName avatarUrl")
      .populate("replyTo", "content senderId imgUrl audioUrl isRecalled");

    messages = messages.map(msg => {
      const msgObj = msg.toObject();
      if (msgObj.isViewOnce && msgObj.viewedBy && msgObj.viewedBy.some(id => id.toString() === userId.toString())) {
        msgObj.imgUrl = null;
        msgObj.audioUrl = null;
      }
      return msgObj;
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi lấy tin nhắn ghim", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;
    const userId = req.user._id;

    if (!q || q.trim() === "") {
      return res.status(200).json([]);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không có quyền xem cuộc trò chuyện này" });
    }

    let clearedTime = null;
    if (conversation.clearedAt && conversation.clearedAt.get) {
      clearedTime = conversation.clearedAt.get(userId.toString());
    }

    const query = {
      conversationId,
      content: { $regex: q, $options: "i" },
      deletedFor: { $ne: userId }
    };

    if (clearedTime) {
      query.createdAt = { $gt: new Date(clearedTime) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("senderId", "displayName avatarUrl")
      .populate("replyTo", "content senderId imgUrl audioUrl isRecalled");

    messages = messages.map(msg => {
      const msgObj = msg.toObject();
      if (msgObj.isViewOnce && msgObj.viewedBy && msgObj.viewedBy.some(id => id.toString() === userId.toString())) {
        msgObj.imgUrl = null;
        msgObj.audioUrl = null;
      }
      return msgObj;
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Lỗi tìm kiếm tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const markConversationAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong cuộc trò chuyện này" });
    }

    const allowReadReceipts = req.user.readReceipts !== false;

    const updateObj = {
      $set: { [`unreadCounts.${userId}`]: 0 }
    };

    if (allowReadReceipts) {
      updateObj.$addToSet = { seenBy: userId };
    }

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      updateObj,
      { new: true }
    ).populate({
      path: "lastMessage.senderId",
      select: "displayName avatarUrl coverUrl note",
    });

    if (allowReadReceipts) {
      // Update individual messages viewedBy array
      await Message.updateMany(
        { conversationId, senderId: { $ne: userId }, viewedBy: { $ne: userId } },
        { $addToSet: { viewedBy: userId } }
      );
    }

    // Start disappearing messages timer
    const expiringMessages = await Message.find({
      conversationId,
      senderId: { $ne: userId },
      expiresIn: { $exists: true, $ne: null },
      expiresAt: { $exists: false }
    });

    const io = req.app.get("io");

    for (const msg of expiringMessages) {
      msg.expiresAt = new Date(Date.now() + msg.expiresIn * 1000);
      await msg.save();

      if (io) {
        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:update", {
            messageId: msg._id,
            conversationId: conversation._id,
            updates: { expiresAt: msg.expiresAt }
          });
        });
      }
    }

    if (io && updatedConversation) {
      updatedConversation.participants.forEach((p) => {
        if (p.userId.toString() !== userId.toString()) {
          io.to(`user:${p.userId}`).emit("read-message", {
            conversation: updatedConversation,
            lastMessage: updatedConversation.lastMessage,
            readerId: allowReadReceipts ? userId : null
          });
        }
      });
    }

    return res.status(200).json({ message: "Đã đánh dấu là đã xem" });
  } catch (error) {
    console.error("Lỗi xảy ra khi đánh dấu đã xem", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateWallpaper = async (req, res) => {
  try {
    const { id } = req.params;
    const { theme } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong cuộc trò chuyện này" });
    }

    if (conversation.type === "channel") {
      const userParticipant = conversation.participants.find(p => p.userId.toString() === userId.toString());
      if (userParticipant && userParticipant.role === "member") {
        return res.status(403).json({ message: "Chỉ quản trị viên mới có thể đổi hình nền kênh" });
      }
    }

    let wallpaperUrl = theme;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: "nexuschat_wallpapers",
      });
      wallpaperUrl = uploadRes.secure_url;
    }

    conversation.wallpaper = wallpaperUrl;
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { wallpaper: wallpaperUrl }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật hình nền thành công", wallpaper: wallpaperUrl });
  } catch (error) {
    console.error("Lỗi cập nhật hình nền:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateNickname = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetUserId, nickname } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong cuộc trò chuyện này" });
    }

    if (!conversation.nicknames) {
      conversation.nicknames = new Map();
    }

    if (!nickname || nickname.trim() === "") {
      conversation.nicknames.delete(targetUserId);
    } else {
      conversation.nicknames.set(targetUserId, nickname.trim());
    }

    await conversation.save();

    const nicknamesObj = Object.fromEntries(conversation.nicknames);

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { nicknames: nicknamesObj }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật biệt danh thành công", nicknames: nicknamesObj });
  } catch (error) {
    console.error("Lỗi cập nhật biệt danh:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || (conversation.type !== "group" && conversation.type !== "community" && conversation.type !== "channel")) {
      return res.status(404).json({ message: "Không tìm thấy nhóm/kênh" });
    }
    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || (currentUser.role !== "leader" && currentUser.role !== "deputy")) {
      return res.status(403).json({ message: "Chỉ trưởng hoặc phó nhóm mới có thể thêm thành viên" });
    }

    memberIds.forEach(mId => {
      if (!conversation.participants.some(p => p.userId.toString() === mId.toString())) {
        conversation.participants.push({ userId: mId, role: "member", joinedAt: new Date() });
      }
    });

    await conversation.save();

    await conversation.populate("participants.userId", "displayName avatarUrl coverUrl note presenceStatus");
    const formattedParticipants = conversation.participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      coverUrl: p.userId?.coverUrl ?? null,
      note: p.userId?.note,
      presenceStatus: p.userId?.presenceStatus ?? 'online',
      joinedAt: p.joinedAt,
      role: p.role,
    }));

    const formattedConversation = {
      ...conversation.toObject(),
      participants: formattedParticipants,
    };

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach(p => {
        io.to(`user:${p.userId._id}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: formattedParticipants }
        });
        if (memberIds.includes(p.userId._id.toString())) {
          io.to(`user:${p.userId._id}`).emit("new-group", formattedConversation);
        }
      });
    }

    return res.status(200).json({ message: "Thêm thành viên thành công", participants: formattedParticipants });
  } catch (error) {
    console.error("Error in addGroupMembers:", error);
    import("fs").then(fs => fs.writeFileSync("error_log_add.txt", error.stack));
    return res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || (conversation.type !== "group" && conversation.type !== "community" && conversation.type !== "channel")) {
      return res.status(404).json({ message: "Không tìm thấy nhóm/kênh" });
    }
    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    const targetMember = conversation.participants.find(p => p.userId.toString() === memberId.toString());

    if (!currentUser || !targetMember) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    if (userId.toString() !== memberId.toString()) {
      if (currentUser.role === "member") {
        return res.status(403).json({ message: "Bạn không có quyền xóa thành viên" });
      }
      if (currentUser.role === "deputy" && targetMember.role !== "member") {
        return res.status(403).json({ message: "Phó nhóm chỉ có thể xóa thành viên thường" });
      }
    }

    conversation.participants = conversation.participants.filter(p => p.userId.toString() !== memberId.toString());
    await conversation.save();

    await conversation.populate("participants.userId", "displayName avatarUrl coverUrl note presenceStatus");
    const formattedParticipants = conversation.participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      coverUrl: p.userId?.coverUrl ?? null,
      note: p.userId?.note,
      presenceStatus: p.userId?.presenceStatus ?? 'online',
      joinedAt: p.joinedAt,
      role: p.role,
    }));

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${memberId}`).emit("conversation:removed", { conversationId: id });
      conversation.participants.forEach(p => {
        io.to(`user:${p.userId._id}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: formattedParticipants }
        });
      });
    }
    return res.status(200).json({ message: "Xóa thành viên thành công", participants: formattedParticipants });
  } catch (error) {
    console.error("Error in removeGroupMember:", error);
    import("fs").then(fs => fs.writeFileSync("error_log_remove.txt", error.stack));
    return res.status(500).json({ message: "Lỗi hệ thống: " + error.message });
  }
};

export const updateGroupRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId, role } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || !["group", "community", "channel"].includes(conversation.type)) return res.status(404).json({ message: "Không tìm thấy nhóm/kênh" });

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || currentUser.role !== "leader") return res.status(403).json({ message: "Chỉ trưởng nhóm mới có quyền" });

    if (role === "deputy") {
      const currentDeputies = conversation.participants.filter(p => p.role === "deputy");
      const targetMember = conversation.participants.find(p => p.userId.toString() === memberId.toString());
      if (targetMember && targetMember.role !== "deputy" && currentDeputies.length >= 3) {
        return res.status(400).json({ message: "Chỉ có thể có tối đa 3 phó nhóm" });
      }
    }

    const member = conversation.participants.find(p => p.userId.toString() === memberId.toString());
    if (member) member.role = role;

    if (role === "leader" && memberId.toString() !== userId.toString()) {
      currentUser.role = "member";
    }

    await conversation.save();

    await conversation.populate("participants.userId", "displayName avatarUrl coverUrl note presenceStatus");
    const formattedParticipants = conversation.participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      coverUrl: p.userId?.coverUrl ?? null,
      note: p.userId?.note,
      presenceStatus: p.userId?.presenceStatus ?? 'online',
      joinedAt: p.joinedAt,
      role: p.role,
    }));

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach(p => {
        io.to(`user:${p.userId._id}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: formattedParticipants }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật quyền thành công", participants: formattedParticipants });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || (conversation.type !== "group" && conversation.type !== "community" && conversation.type !== "channel")) {
      return res.status(404).json({ message: "Không tìm thấy nhóm/kênh" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || (currentUser.role !== "leader" && currentUser.role !== "deputy")) {
      return res.status(403).json({ message: "Chỉ trưởng hoặc phó nhóm mới có thể thay đổi thông tin nhóm" });
    }

    if (name) conversation.group.name = name;
    if (description !== undefined) conversation.group.description = description;

    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { group: conversation.group }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật thông tin nhóm thành công", group: conversation.group });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateGroupAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || (conversation.type !== "group" && conversation.type !== "community" && conversation.type !== "channel")) {
      return res.status(404).json({ message: "Không tìm thấy nhóm/kênh" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    const isLeaderOrDeputy = currentUser && (currentUser.role === "leader" || currentUser.role === "deputy");
    const isSettingInitialAvatar = !conversation.group.avatar && currentUser;

    if (!isLeaderOrDeputy && !isSettingInitialAvatar) {
      return res.status(403).json({ message: "Chỉ trưởng hoặc phó nhóm mới có quyền thay đổi ảnh nhóm" });
    }

    // Upload to cloudinary
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURI = "data:" + file.mimetype + ";base64," + b64;

    // Import cloudinary at the top or dynamically
    const cloudinary = (await import("../libs/cloudinary.js")).default;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "nexuschat_avatars",
      transformation: [{ width: 400, height: 400, crop: "fill" }],
    });

    // Delete old avatar from Cloudinary if exists
    if (conversation.group.avatarId) {
      await cloudinary.uploader.destroy(conversation.group.avatarId);
    }

    conversation.group.avatar = result.secure_url;
    conversation.group.avatarId = result.public_id;
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { group: conversation.group }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật ảnh đại diện nhóm thành công", group: conversation.group });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const removeGroupAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || currentUser.role !== "leader") {
      return res.status(403).json({ message: "Chỉ trưởng nhóm mới có quyền gỡ ảnh nhóm" });
    }

    if (conversation.group.avatarId) {
      const cloudinary = (await import("../libs/cloudinary.js")).default;
      await cloudinary.uploader.destroy(conversation.group.avatarId);
    }

    conversation.group.avatar = null;
    conversation.group.avatarId = null;
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { group: conversation.group }
        });
      });
    }

    return res.status(200).json({ message: "Đã gỡ ảnh đại diện nhóm", group: conversation.group });
  } catch (error) {
    console.error("Error in removeGroupAvatar:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ message: "Vui lòng nhập mật khẩu để xác nhận" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser) {
      return res.status(403).json({ message: "Bạn không có quyền xóa cuộc trò chuyện này" });
    }

    if (conversation.type === "group" && currentUser.role !== "leader") {
      return res.status(403).json({ message: "Chỉ trưởng nhóm mới được giải tán nhóm" });
    }

    if (conversation.type === "channel" && currentUser.role !== "leader") {
      return res.status(403).json({ message: "Chỉ quản trị viên mới được xóa kênh" });
    }

    // Verify password
    // eslint-disable-next-line no-undef
    const User = (await import("../models/User.js")).default;
    const userRecord = await User.findById(userId).select("+hashedPassword");
    if (!userRecord) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const isPasswordValid = await bcrypt.compare(password, userRecord.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    // eslint-disable-next-line no-undef
    const Message = (await import("../models/Message.js")).default;
    await Message.deleteMany({ conversationId: id });
    await conversation.deleteOne();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:delete", { conversationId: id });
      });
    }

    return res.status(200).json({ message: "Xóa cuộc trò chuyện thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong cuộc trò chuyện này" });
    }

    if (!conversation.clearedAt) {
      conversation.clearedAt = new Map();
    }
    conversation.clearedAt.set(userId.toString(), new Date());
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("conversation:clear", { conversationId: id });
    }

    return res.status(200).json({ message: "Xóa đoạn chat thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa đoạn chat:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || (conversation.type !== "group" && conversation.type !== "community" && conversation.type !== "channel")) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser) {
      return res.status(403).json({ message: "Bạn không ở trong nhóm này" });
    }

    // Remove user
    conversation.participants = conversation.participants.filter(p => p.userId.toString() !== userId.toString());

    // Auto promote if leader leaves
    if (currentUser.role === "leader" && conversation.participants.length > 0) {
      // Find oldest member
      const oldestMember = conversation.participants.reduce((oldest, current) => {
        return (new Date(current.joinedAt) < new Date(oldest.joinedAt)) ? current : oldest;
      });
      oldestMember.role = "leader";
    }

    if (conversation.participants.length === 0) {
      // Disband if empty
      // eslint-disable-next-line no-undef
      const Message = (await import("../models/Message.js")).default;
      await Message.deleteMany({ conversationId: id });
      await conversation.deleteOne();
    } else {
      await conversation.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("conversation:delete", { conversationId: id }); // Hide for leaving user
      if (conversation.participants.length > 0) {
        await conversation.populate("participants.userId", "displayName avatarUrl coverUrl note presenceStatus");
        const formattedParticipants = conversation.participants.map(p => ({
          _id: p.userId?._id,
          displayName: p.userId?.displayName,
          avatarUrl: p.userId?.avatarUrl ?? null,
          coverUrl: p.userId?.coverUrl ?? null,
          note: p.userId?.note,
          presenceStatus: p.userId?.presenceStatus ?? 'online',
          joinedAt: p.joinedAt,
          role: p.role,
        }));

        conversation.participants.forEach((p) => {
          io.to(`user:${p.userId._id}`).emit("conversation:update", {
            conversationId: id,
            updates: { participants: formattedParticipants }
          });
        });
      }
    }

    return res.status(200).json({ message: "Đã rời nhóm" });
  } catch (error) {
    console.error("Lỗi khi rời nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const summarizeConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong cuộc trò chuyện này" });
    }

    // eslint-disable-next-line no-undef
    const Message = (await import("../models/Message.js")).default;
    let messages = await Message.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("senderId", "displayName");

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: "Không có tin nhắn nào để tóm tắt" });
    }

    messages = messages.reverse();

    const historyText = messages.map(msg => {
      const senderName = msg.senderId?.displayName || "Người dùng";
      let textContent = msg.content || "";
      if (msg.imgUrl) textContent += " [Hình ảnh đính kèm]";
      if (msg.audioUrl) textContent += " [Âm thanh đính kèm]";
      return `[${senderName}]: ${textContent}`;
    }).join("\\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "API Key bị thiếu" });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction: "Bạn là trợ lý ảo. Hãy đọc kỹ các tin nhắn gần nhất của cuộc trò chuyện sau đây. Nhiệm vụ của bạn là tóm tắt ngắn gọn những ý chính đang được bàn luận, ai đã nói gì quan trọng. Hãy trình bày dưới dạng gạch đầu dòng Markdown rõ ràng, súc tích và dễ đọc."
    });

    const result = await model.generateContent(`Đây là nội dung cuộc trò chuyện:\\n\\n${historyText}\\n\\nHãy tóm tắt lại.`);
    const summary = result.response.text();

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Lỗi khi tóm tắt chat:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tóm tắt" });
  }
};

export const createChannel = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Tên kênh là bắt buộc" });
    }

    const conversation = new Conversation({
      type: "channel",
      isPublic: isPublic || false,
      participants: [{ userId, role: "leader" }],
      group: {
        name,
        description: description || null,
        createdBy: userId,
      },
      lastMessageAt: new Date(),
    });

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl coverUrl note presenceStatus" },
    ]);

    const formattedParticipants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      coverUrl: p.userId?.coverUrl ?? null,
      note: p.userId?.note,
      presenceStatus: p.userId?.presenceStatus ?? 'online',
      joinedAt: p.joinedAt,
      role: p.role,
    }));

    const formattedConversation = {
      ...conversation.toObject(),
      unreadCounts: conversation.unreadCounts || {},
      participants: formattedParticipants,
    };

    return res.status(201).json({ conversation: formattedConversation });
  } catch (error) {
    console.error("Lỗi khi tạo channel", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const explorePublicChannels = async (req, res) => {
  try {
    const { q } = req.query;
    const query = {
      type: "channel",
      isPublic: true,
    };

    if (q && q.trim() !== "") {
      query["group.name"] = { $regex: q, $options: "i" };
    }

    const channels = await Conversation.aggregate([
      { $match: query },
      { $addFields: { followerCount: { $size: "$participants" } } },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: 50 },
    ]);

    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Lỗi khi tìm kênh công khai", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const joinChannel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || conversation.type !== "channel") {
      return res.status(404).json({ message: "Không tìm thấy kênh" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: "Bạn đã tham gia kênh này rồi" });
    }

    // Kiểm tra xem user có bị ban không
    const bannedUser = conversation.bannedUsers?.find(b => b.userId.toString() === userId.toString());
    if (bannedUser) {
      if (bannedUser.expiresAt && new Date() > new Date(bannedUser.expiresAt)) {
        // Hết hạn ban, cho phép tham gia và xóa khỏi danh sách ban
        conversation.bannedUsers = conversation.bannedUsers.filter(b => b.userId.toString() !== userId.toString());
      } else {
        return res.status(403).json({ message: "Bạn đã bị cấm tham gia kênh này" });
      }
    }

    conversation.participants.push({ userId, role: "member" });
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl coverUrl note presenceStatus" },
      {
        path: "seenBy",
        select: "displayName avatarUrl coverUrl note",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl coverUrl note" },
    ]);

    const formattedParticipants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      coverUrl: p.userId?.coverUrl ?? null,
      note: p.userId?.note,
      presenceStatus: p.userId?.presenceStatus ?? 'online',
      joinedAt: p.joinedAt,
      role: p.role,
    }));

    const formattedConversation = {
      ...conversation.toObject(),
      unreadCounts: conversation.unreadCounts || {},
      participants: formattedParticipants,
    };

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("new-group", formattedConversation);
      io.to(`conversation:${id}`).emit("conversation:update", {
        conversationId: id,
        updates: { participantsCount: conversation.participants.length }
      });
    }

    return res.status(200).json({ message: "Tham gia kênh thành công", conversation: formattedConversation });
  } catch (error) {
    console.error("Lỗi khi tham gia kênh", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateChannelVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = req.user._id;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: "Trạng thái công khai không hợp lệ" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || conversation.type !== "channel") {
      return res.status(404).json({ message: "Không tìm thấy kênh" });
    }

    const userParticipant = conversation.participants.find(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!userParticipant || (userParticipant.role !== "leader" && userParticipant.role !== "deputy")) {
      return res.status(403).json({ message: "Chỉ quản trị viên mới có thể thay đổi cài đặt kênh" });
    }

    conversation.isPublic = isPublic;
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: id,
          updates: { isPublic: isPublic }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật thành công", isPublic });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái kênh", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const banGroupMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId, duration } = req.body; // duration in milliseconds, null = permanent
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || !["group", "community", "channel"].includes(conversation.type)) {
      return res.status(404).json({ message: "Không tìm thấy nhóm/kênh" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    const targetMember = conversation.participants.find(p => p.userId.toString() === memberId.toString());

    if (!currentUser || (currentUser.role !== "leader" && currentUser.role !== "deputy")) {
      return res.status(403).json({ message: "Không có quyền thực hiện hành động này" });
    }

    if (currentUser.role === "deputy" && targetMember && targetMember.role !== "member") {
      return res.status(403).json({ message: "Phó nhóm chỉ có thể ban thành viên thường" });
    }

    if (userId.toString() === memberId.toString()) {
      return res.status(400).json({ message: "Không thể tự ban chính mình" });
    }

    // Xóa user khỏi participants
    conversation.participants = conversation.participants.filter(p => p.userId.toString() !== memberId.toString());

    // Thêm vào bannedUsers
    const expiresAt = duration ? new Date(Date.now() + duration) : null;
    const existingBanIndex = conversation.bannedUsers.findIndex(b => b.userId.toString() === memberId.toString());

    if (existingBanIndex >= 0) {
      conversation.bannedUsers[existingBanIndex].expiresAt = expiresAt;
    } else {
      conversation.bannedUsers.push({ userId: memberId, expiresAt });
    }

    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      // Thông báo cho người bị ban để họ bị đá ra
      io.to(`user:${memberId}`).emit("conversation:removed", { conversationId: id, isBanned: true });

      // Update participants cho những người còn lại
      await conversation.populate("participants.userId", "displayName avatarUrl coverUrl note presenceStatus");
      const formattedParticipants = conversation.participants.map(p => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        coverUrl: p.userId?.coverUrl ?? null,
        note: p.userId?.note,
        presenceStatus: p.userId?.presenceStatus ?? 'online',
        joinedAt: p.joinedAt,
        role: p.role,
      }));

      conversation.participants.forEach(p => {
        io.to(`user:${p.userId._id}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: formattedParticipants }
        });
      });
    }

    return res.status(200).json({ message: "Đã cấm người dùng khỏi nhóm/kênh" });
  } catch (error) {
    console.error("Lỗi khi ban user:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getChannelPreview = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm kênh công khai hoặc theo id
    const conversation = await Conversation.findById(id);

    if (!conversation || conversation.type !== "channel") {
      return res.status(404).json({ message: "Không tìm thấy kênh này" });
    }

    // Chỉ trả về thông tin cơ bản
    return res.status(200).json({
      _id: conversation._id,
      name: conversation.group?.name,
      avatar: conversation.group?.avatar,
      description: conversation.group?.description,
      isPublic: conversation.isPublic,
      followerCount: conversation.participants.length
    });
  } catch (error) {
    console.error("Lỗi getChannelPreview:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createVoiceRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên phòng không hợp lệ" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || (currentUser.role !== "leader" && currentUser.role !== "deputy")) {
      return res.status(403).json({ message: "Chỉ trưởng/phó nhóm mới có quyền tạo phòng thoại" });
    }

    if (conversation.group.voiceRooms.length >= 10) {
      return res.status(400).json({ message: "Số lượng phòng thoại tối đa là 10" });
    }

    const newRoom = { name: name.trim(), createdAt: new Date() };
    conversation.group.voiceRooms.push(newRoom);
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { group: conversation.group }
        });
      });
    }

    return res.status(201).json({ message: "Tạo phòng thoại thành công", voiceRooms: conversation.group.voiceRooms });
  } catch (error) {
    console.error("Lỗi createVoiceRoom:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateVoiceRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên phòng không hợp lệ" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || (currentUser.role !== "leader" && currentUser.role !== "deputy")) {
      return res.status(403).json({ message: "Chỉ trưởng/phó nhóm mới có quyền sửa phòng thoại" });
    }

    const room = conversation.group.voiceRooms.id(roomId);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng thoại" });
    }

    room.name = name.trim();
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { group: conversation.group }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật tên phòng thành công", voiceRooms: conversation.group.voiceRooms });
  } catch (error) {
    console.error("Lỗi updateVoiceRoom:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteVoiceRoom = async (req, res) => {
  try {
    const { id, roomId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || (currentUser.role !== "leader" && currentUser.role !== "deputy")) {
      return res.status(403).json({ message: "Chỉ trưởng/phó nhóm mới có quyền xóa phòng thoại" });
    }

    const room = conversation.group.voiceRooms.id(roomId);
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng thoại" });
    }
    if (room.name === "Phòng chung") {
      return res.status(400).json({ message: "Không thể xóa phòng mặc định" });
    }

    conversation.group.voiceRooms.pull({ _id: roomId });
    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: conversation._id,
          updates: { group: conversation.group }
        });
      });
    }

    return res.status(200).json({ message: "Phòng thoại đã được xóa", voiceRooms: conversation.group.voiceRooms });
  } catch (error) {
    console.error("Lỗi xóa phòng thoại:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleIncognitoMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, duration } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    if (conversation.type !== "direct") {
      return res.status(400).json({ message: "Chat ẩn danh chỉ hỗ trợ chat 1:1" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong cuộc trò chuyện này" });
    }

    if (isActive) {
      if (!duration || duration <= 0) {
        return res.status(400).json({ message: "Thời gian không hợp lệ" });
      }
      conversation.incognitoMode = {
        isActive: true,
        expiresAt: new Date(Date.now() + duration),
        startedAt: new Date(),
        startedBy: userId,
      };
    } else {
      conversation.incognitoMode = {
        isActive: false,
        expiresAt: null,
        startedAt: null,
        startedBy: null,
      };

      // Xóa tất cả tin nhắn đã gửi trong lúc bật chế độ ẩn danh (có expiresAt)
      await Message.deleteMany({
        conversationId: id,
        expiresAt: { $ne: null }
      });

    }

    await conversation.save();

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: id,
          updates: { incognitoMode: conversation.incognitoMode }
        });
        
        // Cập nhật lại UI client sau khi xóa tin nhắn (nếu tắt)
        if (!isActive) {
          io.to(`user:${p.userId}`).emit("conversation:clear", { conversationId: id });
        }
      });
    }

    return res.status(200).json({ message: isActive ? "Đã bật chat ẩn danh" : "Đã tắt chat ẩn danh", incognitoMode: conversation.incognitoMode });
  } catch (error) {
    console.error("Lỗi toggleIncognitoMode:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
