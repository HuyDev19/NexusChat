import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";
import { toast } from "sonner";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      unlockedConversations: [],
      convoLoading: false, // convo loading
      messageLoading: false,
      loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          unlockedConversations: [],
          convoLoading: false,
          messageLoading: false,
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchConversations:", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;

        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra khi fetchMessages:", error);
        } finally {
          set({ messageLoading: false });
        }
      },
      sendDirectMessage: async (recipientId, content, imgUrl, audioUrl, expiresIn, isViewOnce) => {
        try {
          const { activeConversationId } = get();
          const sentMessage = await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
            audioUrl,
            expiresIn,
            isViewOnce
          );

          const conversationId = sentMessage.conversationId || activeConversationId;

          if (conversationId) {
            set((state) => {
              const prevItems = state.messages[conversationId]?.items ?? [];
              const exists = prevItems.some((m) => m._id === sentMessage._id);

              return {
                messages: {
                  ...state.messages,
                  [conversationId]: {
                    items: exists ? prevItems : [...prevItems, { ...sentMessage, isOwn: true }],
                    hasMore: state.messages[conversationId]?.hasMore ?? false,
                    nextCursor: state.messages[conversationId]?.nextCursor ?? null,
                  },
                },
                conversations: state.conversations.map((c) =>
                  c._id === conversationId
                    ? {
                        ...c,
                        lastMessage: {
                          _id: sentMessage._id,
                          content: sentMessage.content ?? "",
                          createdAt: sentMessage.createdAt,
                          sender: {
                            _id: sentMessage.senderId,
                            displayName: "",
                            avatarUrl: null,
                          },
                        },
                        lastMessageAt: sentMessage.createdAt,
                        seenBy: [],
                      }
                    : c
                ),
              };
            });
          }
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi direct message", error);
          throw error;
        }
      },
      sendGroupMessage: async (conversationId, content, imgUrl, audioUrl, expiresIn, isViewOnce) => {
        try {
          const sentMessage = await chatService.sendGroupMessage(conversationId, content, imgUrl, audioUrl, expiresIn, isViewOnce);

          set((state) => {
            const prevItems = state.messages[conversationId]?.items ?? [];
            const exists = prevItems.some((m) => m._id === sentMessage._id);

            return {
              messages: {
                ...state.messages,
                [conversationId]: {
                  items: exists ? prevItems : [...prevItems, { ...sentMessage, isOwn: true }],
                  hasMore: state.messages[conversationId]?.hasMore ?? false,
                  nextCursor: state.messages[conversationId]?.nextCursor ?? null,
                },
              },
              conversations: state.conversations.map((c) =>
                c._id === conversationId
                  ? {
                      ...c,
                      lastMessage: {
                        _id: sentMessage._id,
                        content: sentMessage.content ?? "",
                        createdAt: sentMessage.createdAt,
                        sender: {
                          _id: sentMessage.senderId,
                          displayName: "",
                          avatarUrl: null,
                        },
                      },
                      lastMessageAt: sentMessage.createdAt,
                      seenBy: [],
                    }
                  : c
              ),
            };
          });
        } catch (error) {
          console.error("Lỗi xảy ra gửi group message", error);
          throw error;
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Lỗi xảy khi ra add message:", error);
        }
      },
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                  ...c,
                  unreadCounts: {
                    ...c.unreadCounts,
                    [user._id]: 0,
                  },
                }
                : c
            ),
          }));
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
        } finally {
          set({ loading: false });
        }
      },
      updateParticipantData: (updatedUser) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            const hasParticipant = c.participants.some(p => p._id === updatedUser._id);
            if (!hasParticipant) return c;
            
            return {
              ...c,
              participants: c.participants.map(p => 
                p._id === updatedUser._id ? { ...p, displayName: updatedUser.displayName || p.displayName, avatarUrl: updatedUser.avatarUrl ?? p.avatarUrl } : p
              ),
              lastMessage: c.lastMessage && c.lastMessage.sender._id === updatedUser._id ? {
                ...c.lastMessage,
                sender: {
                  ...c.lastMessage.sender,
                  displayName: updatedUser.displayName || c.lastMessage.sender.displayName,
                  avatarUrl: updatedUser.avatarUrl ?? c.lastMessage.sender.avatarUrl,
                }
              } : c.lastMessage
            };
          })
        }));
      },
      uploadAudio: async (file) => {
        const formData = new FormData();
        formData.append("file", file, "audio.webm");
        const res = await chatService.uploadAudio(formData);
        return res.audioUrl;
      },
      uploadImage: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await chatService.uploadImage(formData);
        return res.imgUrl;
      },
      reactToMessage: async (messageId, emoji) => {
        try {
          await chatService.reactToMessage(messageId, emoji);
        } catch (error) {
          console.error("Lỗi xảy ra khi gửi reaction:", error);
        }
      },
      pinMessage: async (messageId) => {
        try {
          await chatService.pinMessage(messageId);
        } catch (error: any) {
          console.error("Lỗi xảy ra khi ghim tin nhắn:", error);
          if (error.response?.status === 400) {
            toast.error(error.response.data.message || "Không thể ghim tin nhắn.");
          } else {
            toast.error("Lỗi hệ thống khi ghim tin nhắn.");
          }
        }
      },
      markMediaAsViewed: async (messageId) => {
        try {
          await chatService.markMediaAsViewed(messageId);
        } catch (error) {
          console.error("Lỗi xảy ra khi đánh dấu xem ảnh:", error);
        }
      },
      recallMessage: async (messageId) => {
        try {
          await chatService.recallMessage(messageId);
        } catch (error: any) {
          console.error("Lỗi xảy ra khi thu hồi tin nhắn:", error);
          toast.error(error.response?.data?.message || "Lỗi hệ thống khi thu hồi tin nhắn.");
        }
      },
      updateWallpaper: async (conversationId, data) => {
        try {
          let payload: string | FormData;
          if (data instanceof File) {
            payload = new FormData();
            payload.append("image", data);
          } else {
            payload = data as string;
          }
          await chatService.updateWallpaper(conversationId, payload);
          toast.success("Cập nhật hình nền thành công!");
        } catch (error) {
          console.error("Lỗi khi cập nhật hình nền:", error);
          toast.error("Không thể cập nhật hình nền.");
        }
      },
      updateNickname: async (conversationId, targetUserId, nickname) => {
        try {
          await chatService.updateNickname(conversationId, targetUserId, nickname);
          toast.success("Cập nhật biệt danh thành công!");
        } catch (error) {
          console.error("Lỗi khi cập nhật biệt danh:", error);
          toast.error("Không thể cập nhật biệt danh.");
        }
      },
      updateConversationFields: (conversationId, fields) => {
        set((state) => {
          const index = state.conversations.findIndex(c => c._id === conversationId);
          if (index !== -1) {
            const newConvos = [...state.conversations];
            newConvos[index] = { ...newConvos[index], ...fields };
            return { conversations: newConvos };
          }
          return state;
        });
      },
      updateMessageReactions: (conversationId, messageId, reactions) => {
        set((state) => {
          const currentItems = state.messages[conversationId]?.items;
          if (!currentItems) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: currentItems.map((m) =>
                  m._id === messageId ? { ...m, reactions } : m
                ),
              },
            },
          };
        });
      },
      updateMessagePinStatus: (conversationId, messageId, isPinned) => {
        set((state) => {
          const currentItems = state.messages[conversationId]?.items;
          if (!currentItems) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: currentItems.map((m) =>
                  m._id === messageId ? { ...m, isPinned } : m
                ),
              },
            },
          };
        });
      },
      updateMessageFields: (conversationId, messageId, fields) => {
        set((state) => {
          const currentItems = state.messages[conversationId]?.items;
          if (!currentItems) return state;

          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...state.messages[conversationId],
                items: currentItems.map((m) =>
                  m._id === messageId ? { ...m, ...fields } : m
                ),
              },
            },
          };
        });
      },
      unlockConversation: (conversationId) => {
        set((state) => ({
          unlockedConversations: [...state.unlockedConversations, conversationId]
        }));
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);