import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import cloudinary from "../libs/cloudinary.js";

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
        "participants.userId": { $all: [userId, participantId] },
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
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl presenceStatus" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl presenceStatus" },
    ]);

    const formattedParticipants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
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
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl presenceStatus",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl presenceStatus",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        presenceStatus: p.userId?.presenceStatus ?? 'online',
        joinedAt: p.joinedAt,
        role: p.role,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
      };
    }).filter(convo => {
      // Ignore conversations if cleared and no new messages
      if (convo.clearedAt && convo.clearedAt instanceof Map) {
        const clearedTime = convo.clearedAt.get(userId.toString());
        if (clearedTime && convo.lastMessageAt) {
          if (new Date(convo.lastMessageAt) <= new Date(clearedTime)) {
            return false;
          }
        }
      } else if (convo.clearedAt) {
        // Fallback if it's a plain object after toObject()
        const clearedTime = convo.clearedAt[userId.toString()];
        if (clearedTime && convo.lastMessageAt) {
          if (new Date(convo.lastMessageAt) <= new Date(clearedTime)) {
            return false;
          }
        }
      }
      return true;
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const userId = req.user._id;
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
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOtring();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
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

    await Conversation.updateOne(
      { _id: conversationId },
      {
        $addToSet: { seenBy: userId },
        $set: { [`unreadCounts.${userId}`]: 0 }
      }
    );

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
    if (!conversation || conversation.type !== "group") return res.status(404).json({ message: "Không tìm thấy nhóm" });

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || currentUser.role !== "leader") return res.status(403).json({ message: "Chỉ trưởng nhóm mới có thể thêm thành viên" });

    memberIds.forEach(mId => {
      if (!conversation.participants.some(p => p.userId.toString() === mId.toString())) {
        conversation.participants.push({ userId: mId, role: "member", joinedAt: new Date() });
      }
    });

    await conversation.save();

    await conversation.populate("participants.userId", "displayName avatarUrl presenceStatus");
    const formattedParticipants = conversation.participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
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
    if (!conversation || conversation.type !== "group") return res.status(404).json({ message: "Không tìm thấy nhóm" });

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || (currentUser.role !== "leader" && userId.toString() !== memberId.toString())) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    conversation.participants = conversation.participants.filter(p => p.userId.toString() !== memberId.toString());
    await conversation.save();

    await conversation.populate("participants.userId", "displayName avatarUrl presenceStatus");
    const formattedParticipants = conversation.participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
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
    if (!conversation || conversation.type !== "group") return res.status(404).json({ message: "Không tìm thấy nhóm" });

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || currentUser.role !== "leader") return res.status(403).json({ message: "Chỉ trưởng nhóm" });

    const member = conversation.participants.find(p => p.userId.toString() === memberId.toString());
    if (member) member.role = role;

    await conversation.save();

    await conversation.populate("participants.userId", "displayName avatarUrl presenceStatus");
    const formattedParticipants = conversation.participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
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
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser || currentUser.role !== "leader") {
      return res.status(403).json({ message: "Chỉ trưởng nhóm mới có thể thay đổi thông tin nhóm" });
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
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
    }

    const currentUser = conversation.participants.find(p => p.userId.toString() === userId.toString());
    if (!currentUser) {
      return res.status(403).json({ message: "Không có quyền" });
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

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

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
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Không tìm thấy nhóm" });
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
        await conversation.populate("participants.userId", "displayName avatarUrl presenceStatus");
        const formattedParticipants = conversation.participants.map(p => ({
          _id: p.userId?._id,
          displayName: p.userId?.displayName,
          avatarUrl: p.userId?.avatarUrl ?? null,
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