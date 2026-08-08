/**
 * Đăng ký các Socket.IO event handlers liên quan đến cuộc gọi (Signaling)
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 */
export function registerCallSocketHandlers(io, socket) {
  const userId = socket.data.userId;

  // 1. Gửi lời mời gọi đến các thành viên nhận cuộc gọi
  socket.on("call:invite", ({ conversationId, roomName, targetUserIds, isVideo, callerName, callerAvatar }) => {
    if (!targetUserIds || !Array.isArray(targetUserIds)) return;

    targetUserIds.forEach((recipientId) => {
      // Bắn tín hiệu cuộc gọi đến đến phòng riêng của từng người dùng
      io.to(`user:${recipientId}`).emit("call:incoming", {
        conversationId,
        roomName,
        callerId: userId,
        callerName,
        callerAvatar,
        isVideo,
      });
    });
  });

  // 2. Chấp nhận cuộc gọi
  socket.on("call:accept", ({ roomName, callerId }) => {
    // Thông báo cho người gọi biết cuộc gọi đã được nhấc máy
    io.to(`user:${callerId}`).emit("call:accepted", {
      roomName,
      acceptorId: userId,
    });
  });

  // 3. Từ chối cuộc gọi
  socket.on("call:decline", ({ roomName, callerId, reason }) => {
    // Thông báo cho người gọi biết cuộc gọi đã bị từ chối
    io.to(`user:${callerId}`).emit("call:declined", {
      roomName,
      declineId: userId,
      reason: reason || "declined",
    });
  });

  // 4. Kết thúc cuộc gọi
  socket.on("call:end", ({ roomName, participantIds }) => {
    if (!participantIds || !Array.isArray(participantIds)) return;

    participantIds.forEach((pid) => {
      io.to(`user:${pid}`).emit("call:ended", { roomName });
    });
  });
}
