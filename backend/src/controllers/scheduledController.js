import ScheduledMessage from "../models/ScheduledMessage.js";
import Conversation from "../models/Conversation.js";
import mongoose from "mongoose";

export const createScheduledMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const {
      conversationId,
      recipientId,
      content,
      imgUrl,
      audioUrl,
      fileUrl,
      fileName,
      fileSize,
      mentions,
      scheduledFor,
      title,
      type = "direct",
    } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "Thiếu ID cuộc trò chuyện" });
    }

    if (!content && !imgUrl && !audioUrl && !fileUrl) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung hoặc đính kèm tệp" });
    }

    if (!scheduledFor) {
      return res.status(400).json({ message: "Vui lòng chọn thời gian hẹn gửi" });
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: "Thời gian hẹn gửi không hợp lệ" });
    }

    // Thời gian hẹn phải lớn hơn thời gian hiện tại ít nhất 10 giây
    if (scheduledDate.getTime() <= Date.now() + 5000) {
      return res.status(400).json({ message: "Thời gian hẹn gửi phải cách thời điểm hiện tại ít nhất 10 giây" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    const scheduled = await ScheduledMessage.create({
      conversationId,
      senderId,
      recipientId: recipientId || null,
      type: conversation.type === "direct" ? "direct" : "group",
      title: title || null,
      content: content || "",
      imgUrl: imgUrl || null,
      audioUrl: audioUrl || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      mentions: mentions || [],
      scheduledFor: scheduledDate,
      status: "pending",
    });

    const populated = await ScheduledMessage.findById(scheduled._id)
      .populate("senderId", "displayName avatarUrl")
      .populate("conversationId", "type group participants");

    return res.status(201).json({
      message: "Lên lịch tin nhắn thành công",
      scheduledMessage: populated,
    });
  } catch (error) {
    console.error("Lỗi khi lên lịch tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi lên lịch tin nhắn" });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { conversationId } = req.params;

    const query = {
      senderId,
      status: "pending",
    };

    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      query.conversationId = conversationId;
    }

    const list = await ScheduledMessage.find(query)
      .sort({ scheduledFor: 1 })
      .populate("senderId", "displayName avatarUrl")
      .populate("conversationId", "type group");

    return res.status(200).json({ scheduledMessages: list });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tin nhắn đã hẹn giờ:", error);
    return res.status(500).json({ message: "Lỗi khi lấy danh sách tin nhắn đã hẹn giờ" });
  }
};

export const cancelScheduledMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id } = req.params;

    const item = await ScheduledMessage.findOne({ _id: id, senderId, status: "pending" });
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn hẹn giờ hoặc tin nhắn đã được gửi" });
    }

    item.status = "cancelled";
    await item.save();

    return res.status(200).json({ message: "Đã hủy lịch gửi tin nhắn thành công", id });
  } catch (error) {
    console.error("Lỗi khi hủy tin nhắn hẹn giờ:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi hủy tin nhắn hẹn giờ" });
  }
};

export const updateScheduledMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { id } = req.params;
    const { content, scheduledFor, title } = req.body;

    const item = await ScheduledMessage.findOne({ _id: id, senderId, status: "pending" });
    if (!item) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn hẹn giờ" });
    }

    if (content !== undefined) item.content = content;
    if (title !== undefined) item.title = title;
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return res.status(400).json({ message: "Thời gian hẹn gửi không hợp lệ" });
      }
      item.scheduledFor = scheduledDate;
    }

    await item.save();
    return res.status(200).json({ message: "Cập nhật thành công", scheduledMessage: item });
  } catch (error) {
    console.error("Lỗi khi cập nhật tin nhắn hẹn giờ:", error);
    return res.status(500).json({ message: "Lỗi máy chủ khi cập nhật tin nhắn hẹn giờ" });
  }
};
