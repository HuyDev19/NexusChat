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
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
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
    }));

    const formattedConversation = {
      ...conversation.toObject(),
      unreadCounts: conversation.unreadCounts || {},
      participants: formattedParticipants,
    };

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
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
      };
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

    if (cursor) {
      query.createAt = { $lt: new Date(cursor) };
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

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: conversation.participants }
        });
        if (memberIds.includes(p.userId.toString())) {
          io.to(`user:${p.userId}`).emit("new-group", conversation);
        }
      });
    }

    return res.status(200).json({ message: "Thêm thành viên thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
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

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${memberId}`).emit("conversation:removed", { conversationId: id });
      conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: conversation.participants }
        });
      });
    }
    return res.status(200).json({ message: "Xóa thành viên thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
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

    const io = req.app.get("io");
    if (io) {
      conversation.participants.forEach(p => {
        io.to(`user:${p.userId}`).emit("conversation:update", {
          conversationId: id,
          updates: { participants: conversation.participants }
        });
      });
    }

    return res.status(200).json({ message: "Cập nhật quyền thành công" });
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

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không có quyền xóa cuộc trò chuyện này" });
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