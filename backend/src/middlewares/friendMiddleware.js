import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

// giúp tạo cặp userA và userB theo thứ tự để dễ dàng kiểm tra
const pair = (a, b) => {
  const aStr = a?.toString();
  const bStr = b?.toString();

  if (!aStr || !bStr) return [aStr, bStr];

  return aStr < bStr ? [aStr, bStr] : [bStr, aStr];
};

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id?.toString();
    const recipientId = req.body?.recipientId ?? null;
    const rawMemberIds = Array.isArray(req.body?.memberIds)
      ? req.body.memberIds
      : [];

    // xóa trùng lặp và loại bỏ chính mình khỏi danh sách thành viên
    const memberIds = [
      ...new Set(
        rawMemberIds
          .map((id) => id?.toString())
          .filter((id) => id && id !== me)
      ),
    ];

    if (!recipientId && memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Cần cung cấp recipientId hoặc memberIds" });
    }

    if (recipientId) {
      const targetId = recipientId.toString();

      if (targetId === me) {
        return res
          .status(400)
          .json({ message: "Không thể tạo cuộc trò chuyện với chính mình" });
      }

      const [userA, userB] = pair(me, targetId);

      const isFriend = await Friend.findOne({ userA, userB });

      if (!isFriend) {
        return res.status(403).json({ message: "Bạn chưa kết bạn với người này" });
      }

      return next();
    }

    if (memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Cần ít nhất một thành viên khác ngoài bản thân" });
    }

    const friendChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : memberId;
    });

    const results = await Promise.all(friendChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res
        .status(403)
        .json({ message: "Bạn chỉ có thể thêm bạn bè vào nhóm.", notFriends });
    }

    next();
  } catch (error) {
    console.error("Lỗi xảy ra khi checkFriendship:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Bạn không ở trong group này." });
    }

    req.conversation = conversation;

    next();
  } catch (error) {
    console.error("Lỗi checkGroupMembership:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};