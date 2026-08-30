/**
 * Đăng ký các Socket.IO event handlers liên quan đến cuộc gọi (Signaling)
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 */
export const activeGroupCalls = new Map(); // Map<conversationId, { roomName, isVideo, participants: Set<string> }>
export const activeRoomCalls = new Map(); // Map<conversationId:roomId, Set<userId>>
export function registerCallSocketHandlers(io, socket) {
  const userId = socket.data.userId;

  // 1. Gửi lời mời gọi đến các thành viên nhận cuộc gọi
  socket.on("call:invite", ({ conversationId, roomName, targetUserIds, isVideo, callerName, callerAvatar, conversationType }) => {
    if (!targetUserIds || !Array.isArray(targetUserIds)) return;

    if (conversationType === 'group' || conversationType === 'community') {
      if (!activeGroupCalls.has(conversationId)) {
        activeGroupCalls.set(conversationId, {
          roomName,
          isVideo,
          participants: new Set([userId])
        });
      }
      // Thông báo cho cả phòng biết có cuộc gọi đang diễn ra
      io.to(conversationId).emit("call:active_update", {
        conversationId,
        roomName,
        isVideo,
        active: true
      });
    }

    targetUserIds.forEach((recipientId) => {
      // Bắn tín hiệu cuộc gọi đến đến phòng riêng của từng người dùng
      io.to(`user:${recipientId}`).emit("call:incoming", {
        conversationId,
        roomName,
        callerId: userId,
        callerName,
        callerAvatar,
        isVideo,
        conversationType
      });
    });
  });

  // 2. Chấp nhận cuộc gọi
  socket.on("call:accept", ({ roomName, callerId, conversationId, conversationType }) => {
    if ((conversationType === 'group' || conversationType === 'community') && conversationId) {
      const call = activeGroupCalls.get(conversationId);
      if (call && call.roomName === roomName) {
        call.participants.add(userId);
      }
    }

    // Thông báo cho người gọi biết cuộc gọi đã được nhấc máy
    io.to(`user:${callerId}`).emit("call:accepted", {
      roomName,
      acceptorId: userId,
    });
  });

  // 3. Từ chối cuộc gọi
  socket.on("call:decline", ({ roomName, callerId, reason, conversationType }) => {
    // Thông báo cho người gọi biết cuộc gọi đã bị từ chối
    io.to(`user:${callerId}`).emit("call:declined", {
      roomName,
      declineId: userId,
      reason: reason || "declined",
      conversationType
    });
  });

  // 4. Thoát khỏi cuộc gọi (cho gọi nhóm)
  socket.on("call:leave", ({ conversationId, roomName }) => {
    const call = activeGroupCalls.get(conversationId);
    if (call && call.roomName === roomName) {
      call.participants.delete(userId);
      // Nếu không còn ai, kết thúc cuộc gọi
      if (call.participants.size === 0) {
        activeGroupCalls.delete(conversationId);
        io.to(conversationId).emit("call:active_update", {
          conversationId,
          active: false
        });
      }
    }
  });

  // 5. Kết thúc cuộc gọi hoàn toàn
  socket.on("call:end", ({ roomName, participantIds, conversationId, conversationType }) => {
    if (conversationType === 'group' || conversationType === 'community') {
      if (conversationId && activeGroupCalls.has(conversationId)) {
        activeGroupCalls.delete(conversationId);
        io.to(conversationId).emit("call:active_update", {
          conversationId,
          active: false
        });
      }
    }

    if (!participantIds || !Array.isArray(participantIds)) return;

    participantIds.forEach((pid) => {
      io.to(`user:${pid}`).emit("call:ended", { roomName });
    });
  });

  // 6. Xử lý khi user ngắt kết nối đột ngột
  socket.on("disconnect", () => {
    for (const [conversationId, call] of activeGroupCalls.entries()) {
      if (call.participants.has(userId)) {
        call.participants.delete(userId);
        if (call.participants.size === 0) {
          activeGroupCalls.delete(conversationId);
          io.to(conversationId).emit("call:active_update", {
            conversationId,
            active: false
          });
        }
      }
    }

    // Xử lý ngắt kết nối cho Voice Rooms
    for (const [roomKey, participants] of activeRoomCalls.entries()) {
      if (participants.has(userId)) {
        participants.delete(userId);
        const [conversationId, roomId] = roomKey.split(':');
        
        io.to(conversationId).emit("room_call:active_update", {
          conversationId,
          roomId,
          participants: Array.from(participants)
        });

        if (participants.size === 0) {
          activeRoomCalls.delete(roomKey);
        }
      }
    }
  });

  // --- VOICE ROOM HANDLERS ---
  
  socket.on("room_call:join", ({ conversationId, roomId, roomName }) => {
    if (!conversationId || !roomId) return;
    
    const roomKey = `${conversationId}:${roomId}`;
    if (!activeRoomCalls.has(roomKey)) {
      activeRoomCalls.set(roomKey, new Set());
    }
    
    const participants = activeRoomCalls.get(roomKey);
    participants.add(userId);

    // Bắn sự kiện tới toàn bộ người trong cuộc trò chuyện (hoặc phòng) để update UI
    io.to(conversationId).emit("room_call:active_update", {
      conversationId,
      roomId,
      participants: Array.from(participants)
    });
  });

  socket.on("room_call:leave", ({ conversationId, roomId, roomName }) => {
    if (!conversationId || !roomId) return;
    
    const roomKey = `${conversationId}:${roomId}`;
    if (activeRoomCalls.has(roomKey)) {
      const participants = activeRoomCalls.get(roomKey);
      participants.delete(userId);

      io.to(conversationId).emit("room_call:active_update", {
        conversationId,
        roomId,
        participants: Array.from(participants)
      });

      if (participants.size === 0) {
        activeRoomCalls.delete(roomKey);
      }
    }
  });
}
