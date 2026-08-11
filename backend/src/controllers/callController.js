import { AccessToken } from "livekit-server-sdk";
import Conversation from "../models/Conversation.js";

/**
 * POST /api/calls/token
 * Sinh LiveKit Access Token cho một cuộc trò chuyện cụ thể
 */
export const getCallToken = async (req, res) => {
  try {
    const { conversationId, roomName, isVideo } = req.body;
    const userId = req.user._id;
    const displayName = req.user.displayName || req.user.username;

    if (!conversationId || !roomName) {
      return res.status(400).json({ message: "Thiếu conversationId hoặc roomName" });
    }

    // 1. Kiểm tra xem cuộc hội thoại có tồn tại và người dùng có phải là thành viên không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không thuộc cuộc trò chuyện này" });
    }

    // 2. Lấy LiveKit credentials
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("[CallController] LỖI: Chưa cấu hình LIVEKIT_API_KEY hoặc LIVEKIT_API_SECRET");
      return res.status(500).json({
        message: "Chưa cấu hình thông tin LiveKit Server trên Backend",
      });
    }

    // 3. Tạo Access Token với quyền tham gia phòng họp
    // Identity của participant sẽ là userId để dễ dàng mapping ở client
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId.toString(),
      name: displayName,
      metadata: JSON.stringify({
        avatarUrl: req.user.avatarUrl || "",
        displayName: displayName,
      }),
    });

    // Cấu hình quyền trong phòng
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.status(200).json({
      token,
      roomName,
      serverUrl: process.env.LIVEKIT_URL || "wss://cloud.livekit.io",
    });
  } catch (error) {
    console.error("Lỗi getCallToken:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi cấp token LiveKit" });
  }
};
