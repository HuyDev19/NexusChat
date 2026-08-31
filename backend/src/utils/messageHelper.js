import Message from "../models/Message.js";

export const getDayDifference = (d1, d2) => {
  if (!d1 || !d2) return 0;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const u1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const u2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((u2 - u1) / (1000 * 60 * 60 * 24));
};

export const getEffectiveStreak = (streak) => {
  if (!streak || !streak.lastMessageDate || !streak.count) {
    return { count: 0, lastMessageDate: null, senders: [], isBothMessaged: false };
  }
  const now = new Date();
  const dayDiff = getDayDifference(streak.lastMessageDate, now);
  // Nếu đã qua >= 2 ngày không nhắn -> Chuỗi bị đứt hoàn toàn
  if (dayDiff >= 2) {
    return { count: 0, lastMessageDate: streak.lastMessageDate, senders: [], isBothMessaged: false };
  }
  // Nếu sang ngày mới (dayDiff === 1), isBothMessaged cho ngày hôm nay mặc định là false cho đến khi cả 2 cùng nhắn hôm nay
  const isBoth = dayDiff === 0 ? Boolean(streak.isBothMessaged) : false;
  return {
    count: streak.count,
    lastMessageDate: streak.lastMessageDate,
    senders: dayDiff === 0 && Array.isArray(streak.senders) ? streak.senders : [],
    isBothMessaged: isBoth,
  };
};

export const updateConversationAfterCreateMessage = async (
  conversation,
  message,
  senderId
) => {
  let finalContent = message.content;
  if (message.isViewOnce) {
    finalContent = "[Tin nhắn xem một lần]";
  } else if (!finalContent) {
    if (message.fileUrl) {
      finalContent = "Đã gửi tệp tin";
    } else if (message.imgUrl) {
      finalContent = "Đã gửi 1 ảnh";
    } else if (message.audioUrl) {
      finalContent = "Đã gửi tin nhắn thoại";
    } else if (message.poll && message.poll.options && message.poll.options.length > 0) {
      finalContent = "Đã tạo một bình chọn";
    } else if (message.sharedContact) {
      finalContent = "Đã chia sẻ 1 liên hệ";
    } else {
      finalContent = "";
    }
  }

  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: finalContent,
      senderId,
      createdAt: message.createdAt,
    },
  });

  // Cập nhật số lượng tin nhắn chưa đọc cho mỗi thành viên
  conversation.participants.forEach((p) => {
    const memberId = (p.userId?._id || p.userId || p._id).toString();
    const isSender = memberId === senderId.toString(); // người gửi không tăng số tin nhắn chưa đọc
    const prevCount = conversation.unreadCounts?.get ? conversation.unreadCounts.get(memberId) : (conversation.unreadCounts?.[memberId] || 0);
    if (conversation.unreadCounts?.set) {
      conversation.unreadCounts.set(memberId, isSender ? 0 : (prevCount || 0) + 1);
    }
  });

  // Cập nhật chuỗi (Streak) cho cuộc trò chuyện 1-1
  if (conversation.type === "direct") {
    const now = new Date();
    const currentStreak = conversation.streak ? (conversation.streak.toObject ? conversation.streak.toObject() : conversation.streak) : { count: 0, lastMessageDate: null, senders: [], isBothMessaged: false };
    const lastDate = currentStreak.lastMessageDate;
    const senderIdStr = senderId.toString();

    // Lấy tin nhắn từ đầu ngày hôm nay (00:00:00) để xác định cả 2 đã nhắn lại với nhau trong ngày chưa
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayMessages = await Message.find({
      conversationId: conversation._id,
      createdAt: { $gte: startOfToday }
    }).select("senderId").limit(30);

    const activeSenders = new Set(todayMessages.map(m => m.senderId.toString()));
    activeSenders.add(senderIdStr);

    const participantIds = (conversation.participants || []).map(p => (p.userId?._id || p.userId || p._id).toString());
    const isBoth = participantIds.length >= 2 && participantIds.every(id => activeSenders.has(id));

    let count = currentStreak.count || 0;
    if (!lastDate || currentStreak.count < 1) {
      count = 1;
    } else {
      const dayDiff = getDayDifference(lastDate, now);
      if (dayDiff >= 2) {
        // Bỏ lỡ >= 1 ngày -> Đứt chuỗi cũ, bắt đầu chuỗi mới từ 1
        count = 1;
      } else if (dayDiff === 1) {
        // Sang ngày kế tiếp: nếu hôm nay cả 2 đã nhắn -> Tăng tiếp chuỗi!
        if (isBoth) {
          count = (currentStreak.count || 1) + 1;
        } else {
          count = currentStreak.count || 1;
        }
      } else {
        // Cùng ngày (dayDiff === 0)
        count = Math.max(currentStreak.count || 1, 1);
      }
    }

    conversation.streak = {
      count: count,
      lastMessageDate: now,
      senders: Array.from(activeSenders),
      isBothMessaged: isBoth,
    };
    if (typeof conversation.markModified === "function") {
      conversation.markModified("streak");
    }
  }
};