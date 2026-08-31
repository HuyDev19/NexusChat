import ScheduledMessage from "../models/ScheduledMessage.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import { handleAIResponse } from "./aiService.js";
import { NEXUS_AI_ID } from "../utils/seedNexusAI.js";

let workerInterval = null;

export const processScheduledMessages = async (io) => {
  try {
    const now = new Date();
    const pendingMessages = await ScheduledMessage.find({
      status: "pending",
      scheduledFor: { $lte: now },
    }).limit(50);

    if (!pendingMessages || pendingMessages.length === 0) return;

    for (const scheduled of pendingMessages) {
      try {
        const conversation = await Conversation.findById(scheduled.conversationId);
        if (!conversation) {
          scheduled.status = "failed";
          scheduled.errorReason = "Conversation not found";
          await scheduled.save();
          continue;
        }

        // Tạo tin nhắn thật
        const message = await Message.create({
          conversationId: scheduled.conversationId,
          senderId: scheduled.senderId,
          content: scheduled.content,
          imgUrl: scheduled.imgUrl,
          audioUrl: scheduled.audioUrl,
          fileUrl: scheduled.fileUrl,
          fileName: scheduled.fileName,
          fileSize: scheduled.fileSize,
          mentions: scheduled.mentions,
        });

        // Cập nhật cuộc trò chuyện
        await updateConversationAfterCreateMessage(conversation, message, scheduled.senderId);
        await conversation.save();

        // Đánh dấu đã gửi
        scheduled.status = "sent";
        scheduled.executedAt = new Date();
        await scheduled.save();

        // Phát socket thông báo đến các thành viên
        if (io) {
          conversation.participants.forEach((p) => {
            const userId = p.userId?._id || p.userId || p._id;
            if (userId) {
              io.to(`user:${userId}`).emit("new-message", {
                message,
                conversation,
                unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
              });
            }
          });

          // Thông báo cho người tạo lịch hẹn
          io.to(`user:${scheduled.senderId}`).emit("scheduled-message:executed", {
            scheduledId: scheduled._id,
            messageId: message._id,
            conversationId: scheduled.conversationId,
          });
        }

        // Kiểm tra gọi AI nếu có tag @NexusAI
        if (
          scheduled.content?.includes("@NexusAI") ||
          (scheduled.mentions && scheduled.mentions.includes(NEXUS_AI_ID))
        ) {
          if (io) {
            handleAIResponse(conversation._id, io, scheduled.senderId);
          }
        }
      } catch (err) {
        console.error(`[ScheduleWorker] Lỗi khi xử lý tin nhắn ${scheduled._id}:`, err);
        scheduled.status = "failed";
        scheduled.errorReason = err.message || "Unknown error";
        await scheduled.save().catch(() => {});
      }
    }
  } catch (error) {
    console.error("[ScheduleWorker] Lỗi worker chu kỳ kiểm tra tin nhắn hẹn giờ:", error);
  }
};

export const checkAndResetExpiredStreaks = async (io) => {
  try {
    const now = new Date();
    // 48 giờ trước
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const expiredConvos = await Conversation.find({
      type: "direct",
      "streak.count": { $gt: 0 },
      "streak.lastMessageDate": { $lte: twoDaysAgo }
    }).limit(50);

    for (const convo of expiredConvos) {
      convo.streak = {
        count: 0,
        lastMessageDate: null,
        senders: [],
        isBothMessaged: false
      };
      if (typeof convo.markModified === "function") {
        convo.markModified("streak");
      }
      await convo.save();

      if (io) {
        convo.participants.forEach((p) => {
          const userId = p.userId?._id || p.userId || p._id;
          if (userId) {
            io.to(`user:${userId}`).emit("conversation:streak-reset", {
              conversationId: convo._id,
              streak: convo.streak
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("[ScheduleWorker] Lỗi khi kiểm tra streak hết hạn:", err);
  }
};

let streakCounter = 0;

export const startScheduleWorker = (io) => {
  if (workerInterval) clearInterval(workerInterval);

  console.log("[ScheduleWorker] Đã khởi động background worker hẹn giờ tin nhắn & dọn streak (mỗi 10 giây)");
  // Chạy ngay lần đầu
  processScheduledMessages(io);
  checkAndResetExpiredStreaks(io);

  // Sau đó chạy định kỳ mỗi 10 giây
  workerInterval = setInterval(() => {
    processScheduledMessages(io);
    streakCounter += 1;
    // Kiểm tra streak hết hạn mỗi 60 giây (mỗi 6 chu kỳ)
    if (streakCounter >= 6) {
      streakCounter = 0;
      checkAndResetExpiredStreaks(io);
    }
  }, 10000);
};

export const stopScheduleWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
};
