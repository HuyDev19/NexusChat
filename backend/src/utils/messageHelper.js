export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });


  // Cập nhật số lượng tin nhắn chưa đọc cho mỗi thành viên
  conversation.participants.forEach((p) => {
    const memberId = p.userId.toString();
    const isSender = memberId === senderId.toString();// người gửi không tăng số tin nhắn chưa đọc
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);// nếu là người gửi thì để 0, không phải người gửi thì tăng lên 1
  });

  // Cập nhật chuỗi (Streak) cho cuộc trò chuyện 1-1
  if (conversation.type === "direct") {
    const now = new Date();
    const lastDate = conversation.streak?.lastMessageDate;

    if (!lastDate) {
      conversation.streak = { count: 1, lastMessageDate: now };
    } else {
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffHours = diffTime / (1000 * 60 * 60);

      if (diffHours > 48) {
        // Quá 48h -> Đứt chuỗi, reset về 1
        conversation.streak = { count: 1, lastMessageDate: now };
      } else if (diffHours > 24) {
        // Qua ngày mới (hơn 24h và dưới 48h) -> Tăng chuỗi
        conversation.streak = { count: (conversation.streak.count || 0) + 1, lastMessageDate: now };
      } else {
        // Cùng ngày (dưới 24h) -> Giữ nguyên chuỗi, chỉ cập nhật thời gian
        conversation.streak.lastMessageDate = now;
      }
    }
  }
};