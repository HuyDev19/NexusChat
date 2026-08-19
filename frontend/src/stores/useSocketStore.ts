import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";

const baseURL = import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:5001";

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const currentUser = useAuthStore.getState().user;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket
    if (!accessToken) return;
    if (!baseURL) {
      console.warn("Socket URL chưa được cấu hình, bỏ qua kết nối realtime.");
      return;
    }

    const socket: Socket = io(baseURL, {
      auth: { 
        token: accessToken,
        userId: currentUser?._id 
      },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
      const conversations = useChatStore.getState().conversations;
      if (conversations && conversations.length > 0) {
        conversations.forEach((c) => {
          socket.emit("join-conversation", c._id);
        });
      }
    });

    socket.on("connect_error", (error) => {
      console.warn("Socket kết nối lỗi:", error.message);
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // user updated
    socket.on("user:updated", (updatedUser) => {
      import("./useFriendStore").then((store) => {
        store.useFriendStore.getState().updateFriendData(updatedUser);
      });
      import("./useChatStore").then((store) => {
        store.useChatStore.getState().updateParticipantData(updatedUser);
      });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        _id: conversation._id,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage,
        unreadCounts,
        streak: conversation.streak,
      };

      useChatStore.getState().updateConversation(updatedConversation);

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      // Phát thông báo đẩy trình duyệt khi tab bị ẩn
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        localStorage.getItem("desktop_notifications") !== "disabled" &&
        document.hidden
      ) {
        const bodyText =
          message.content ||
          (message.imgUrl ? "[Hình ảnh]" : message.audioUrl ? "[Tin nhắn thoại]" : "Bạn có tin nhắn mới");
        new Notification("NexusChat", {
          body: bodyText,
          icon: "/favicon.ico",
        });
      }
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage, readerId }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
      
      if (readerId) {
        useChatStore.getState().markMessagesAsReadBy(conversation._id, readerId);
      }
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // message reactions
    socket.on("message:react", ({ messageId, reactions, conversationId }) => {
      useChatStore.getState().updateMessageReactions(conversationId, messageId, reactions);
    });

    // message pin
    socket.on("message:pin", ({ messageId, isPinned, conversationId }) => {
      useChatStore.getState().updateMessagePinStatus(conversationId, messageId, isPinned);
    });

    // message update (e.g. expiresAt)
    socket.on("message:update", ({ messageId, conversationId, updates }) => {
      useChatStore.getState().updateMessageFields(conversationId, messageId, updates);
    });

    // conversation update (e.g. wallpaper, nicknames)
    socket.on("conversation:update", ({ conversationId, updates }) => {
      useChatStore.getState().updateConversationFields(conversationId, updates);
    });

    socket.on("conversation:removed", ({ conversationId }) => {
      import("./useChatStore").then((store) => {
        store.useChatStore.getState().removeConversation(conversationId);
        import("sonner").then(({ toast }) => {
          toast.info("Bạn đã bị xóa khỏi nhóm.");
        });
      });
    });

    socket.on("conversation:delete", ({ conversationId }) => {
      useChatStore.getState().removeConversation(conversationId);
    });

    // typing events
    socket.on("typing-start", ({ conversationId, userId }) => {
      useChatStore.getState().setTypingStatus(conversationId, userId, true);
    });

    socket.on("typing-end", ({ conversationId, userId }) => {
      useChatStore.getState().setTypingStatus(conversationId, userId, false);
    });

    // ─── LẮNG NGHE CÁC SỰ KIỆN VIDEO CALL ───────────────────
    socket.on("call:incoming", (callInfo) => {
      // Import store động tránh import tròn (circular dependency)
      import("./useCallStore").then((store) => {
        store.useCallStore.getState().setIncomingCall(callInfo);
      });

      // Gửi thông báo đẩy hệ thống bằng Browser Notification API
      if ("Notification" in window && Notification.permission === "granted") {
        const notif = new Notification("Cuộc gọi đến từ NexusChat", {
          body: `${callInfo.callerName} đang gọi ${callInfo.isVideo ? "video" : "thoại"} cho bạn.`,
          icon: callInfo.callerAvatar || "/favicon.ico",
          tag: "nexuschat-call",
          requireInteraction: true, // Giữ thông báo cho đến khi người dùng tắt hoặc bấm vào
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    });

    socket.on("call:accepted", ({ roomName }) => {
      console.log(`[Socket] Thành viên chấp nhận cuộc gọi tại phòng: ${roomName}`);
    });

    socket.on("call:declined", ({ roomName, declineId, reason, conversationType }) => {
      import("./useCallStore").then((store) => {
        const activeCall = store.useCallStore.getState().activeCall;
        if (activeCall && activeCall.roomName === roomName) {
          if (conversationType === 'group' || conversationType === 'community') {
            import("sonner").then(({ toast }) => {
              toast.info("Một thành viên đã từ chối cuộc gọi.");
            });
          } else {
            // Cuộc gọi 1:1, kết thúc hoàn toàn
            store.useCallStore.getState().endCall();
            import("sonner").then(({ toast }) => {
              toast.info("Cuộc gọi bị từ chối.");
            });
          }
        }
      });
    });

    socket.on("call:active_update", (data) => {
      import("./useCallStore").then((store) => {
        store.useCallStore.getState().setActiveGroupCall(data.conversationId, data);
      });
    });

    socket.on("call:ended", ({ roomName }) => {
      import("./useCallStore").then((store) => {
        const activeCall = store.useCallStore.getState().activeCall;
        const incomingCall = store.useCallStore.getState().incomingCall;

        if ((activeCall && activeCall.roomName === roomName) || 
            (incomingCall && incomingCall.roomName === roomName)) {
          store.useCallStore.getState().setActiveCall(null);
          store.useCallStore.getState().setIncomingCall(null);
          import("sonner").then(({ toast }) => {
            toast.info("Cuộc gọi đã kết thúc.");
          });
        }
      });
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      // Huỷ đăng ký sự kiện trước khi disconnect
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:declined");
      socket.off("call:ended");
      socket.off("call:active_update");
      socket.off("user:updated");
      socket.off("typing-start");
      socket.off("typing-end");
      socket.disconnect();
      set({ socket: null });
    }
  },
  emitTypingStart: (conversationId: string, participantIds: string[]) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("typing-start", { conversationId, participantIds });
    }
  },
  emitTypingEnd: (conversationId: string, participantIds: string[]) => {
    const socket = get().socket;
    if (socket) {
      socket.emit("typing-end", { conversationId, participantIds });
    }
  },
}));