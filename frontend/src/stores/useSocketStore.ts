import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";

const baseURL = import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:5001";

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  lastActiveMap: {},
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

    // user last active
    socket.on("user:last-active", ({ userId, lastActiveAt }) => {
      if (userId && lastActiveAt) {
        set((state) => ({
          lastActiveMap: {
            ...state.lastActiveMap,
            [userId]: String(lastActiveAt),
          },
        }));
      }
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

    // streak reset
    socket.on("conversation:streak-reset", ({ conversationId, streak }) => {
      useChatStore.getState().updateConversation({
        _id: conversationId,
        streak: streak || { count: 0, lastMessageDate: null, senders: [], isBothMessaged: false },
      });
    });

    // profile photo events
    socket.on("user:photo-added", ({ userId, photo }) => {
      import("./useAccountInfoModalStore").then((mod) => {
        const modalStore = mod.useAccountInfoModalStore.getState();
        if (modalStore.isOpen && modalStore.user && modalStore.user._id === userId) {
          modalStore.setUserPhotos([photo, ...(modalStore.user.photos || [])]);
        }
      });
    });

    socket.on("user:photo-deleted", ({ userId, photoId }) => {
      import("./useAccountInfoModalStore").then((mod) => {
        const modalStore = mod.useAccountInfoModalStore.getState();
        if (modalStore.isOpen && modalStore.user && modalStore.user._id === userId) {
          modalStore.setUserPhotos((modalStore.user.photos || []).filter((p) => p._id !== photoId));
        }
      });
    });

    socket.on("user:photo-reacted", ({ userId, photoId, reactions }) => {
      import("./useAccountInfoModalStore").then((mod) => {
        const modalStore = mod.useAccountInfoModalStore.getState();
        if (modalStore.isOpen && modalStore.user && modalStore.user._id === userId) {
          modalStore.updatePhotoReactions(photoId, reactions);
        }
      });

      import("./useAuthStore").then((mod) => {
        const authStore = mod.useAuthStore.getState();
        if (authStore.user && authStore.user._id === userId) {
          const updatedPhotos = authStore.user.photos?.map(p => 
            p._id === photoId ? { ...p, reactions } : p
          );
          authStore.setUser({ ...authStore.user, photos: updatedPhotos });
        }
      });
    });

    // stories
    socket.on("story:new", ({ userId, storyId, story }) => {
      import("./useStoryStore").then((store) => {
        store.useStoryStore.getState().addOrUpdateStoryFromSocket(story);
      });
    });

    socket.on("story:viewed", ({ storyId, viewer }) => {
      import("./useStoryStore").then((store) => {
        store.useStoryStore.getState().addStoryViewer(storyId, viewer);
      });
    });

    socket.on("story:reacted", ({ storyId, reaction }) => {
      import("./useStoryStore").then((store) => {
        store.useStoryStore.getState().addStoryReaction(storyId, reaction);
      });
    });

    // message clear
    socket.on("conversation:clear", ({ conversationId }) => {
      import("./useChatStore").then((mod) => {
        mod.useChatStore.setState((state) => {
          const newMessages = { ...state.messages };
          if (newMessages[conversationId]) {
              newMessages[conversationId] = {
                  ...newMessages[conversationId],
                  items: newMessages[conversationId].items.filter(m => !m.expiresAt && !m.expiresIn),
              };
          }
          return { messages: newMessages };
        });
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

    // scheduled message executed
    socket.on("scheduled-message:executed", ({ scheduledId }) => {
      import("./useScheduleStore").then((mod) => {
        mod.useScheduleStore.getState().handleExecutedEvent(scheduledId);
      });
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

    socket.on("room_call:active_update", (data) => {
      import("./useCallStore").then((store) => {
        store.useCallStore.getState().setActiveVoiceRoom(data.conversationId, data.roomId, data.participants);
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
      socket.off("room_call:active_update");
      socket.off("user:updated");
      socket.off("typing-start");
      socket.off("typing-end");
      socket.off("story:new");
      socket.off("story:viewed");
      socket.off("story:reacted");
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