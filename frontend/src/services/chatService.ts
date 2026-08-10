import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string,
    conversationId?: string,
    audioUrl?: string,
    expiresIn?: number,
    isViewOnce?: boolean
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      audioUrl,
      expiresIn,
      isViewOnce,
    });

    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    audioUrl?: string,
    expiresIn?: number,
    isViewOnce?: boolean
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      audioUrl,
      expiresIn,
      isViewOnce,
    });
    return res.data.message;
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },

  async uploadAudio(formData: FormData): Promise<{ audioUrl: string }> {
    const res = await api.post("/messages/upload-audio", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async uploadImage(formData: FormData): Promise<{ imgUrl: string }> {
    const res = await api.post("/messages/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async reactToMessage(messageId: string, emoji: string) {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data;
  },

  async pinMessage(messageId: string) {
    const res = await api.post(`/messages/${messageId}/pin`);
    return res.data;
  },

  async markMediaAsViewed(messageId: string) {
    const res = await api.post(`/messages/${messageId}/view-media`);
    return res.data;
  },

  async recallMessage(messageId: string) {
    const res = await api.post(`/messages/${messageId}/recall`);
    return res.data;
  },

  async updateWallpaper(conversationId: string, data: string | FormData) {
    let res;
    if (typeof data === "string") {
      res = await api.post(`/conversations/${conversationId}/wallpaper`, { theme: data });
    } else {
      res = await api.post(`/conversations/${conversationId}/wallpaper`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return res.data;
  },

  async updateNickname(conversationId: string, targetUserId: string, nickname: string) {
    const res = await api.post(`/conversations/${conversationId}/nickname`, { targetUserId, nickname });
    return res.data;
  },
};