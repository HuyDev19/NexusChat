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

  async getPinnedMessages(id: string): Promise<Message[]> {
    const res = await api.get(`/conversations/${id}/messages/pinned`);
    return res.data;
  },

  async searchMessages(id: string, q: string): Promise<Message[]> {
    const res = await api.get(`/conversations/${id}/messages/search?q=${encodeURIComponent(q)}`);
    return res.data;
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string | null,
    conversationId?: string,
    audioUrl?: string | null,
    expiresIn?: number,
    isViewOnce?: boolean,
    mentions?: string[],
    replyTo?: string,
    isForwarded?: boolean,
    fileUrl?: string | null,
    fileName?: string | null,
    fileSize?: number | null
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      audioUrl,
      expiresIn,
      isViewOnce,
      mentions,
      replyTo,
      isForwarded,
      fileUrl,
      fileName,
      fileSize,
    });

    return res.data;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string | null,
    audioUrl?: string | null,
    expiresIn?: number,
    isViewOnce?: boolean,
    poll?: any,
    mentions?: string[],
    replyTo?: string,
    isForwarded?: boolean,
    fileUrl?: string | null,
    fileName?: string | null,
    fileSize?: number | null
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      audioUrl,
      expiresIn,
      isViewOnce,
      poll,
      mentions,
      replyTo,
      isForwarded,
      fileUrl,
      fileName,
      fileSize,
    });
    return res.data;
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

  async createChannel(name: string, description?: string, isPublic: boolean = false) {
    const res = await api.post("/conversations/channel", { name, description, isPublic });
    return res.data;
  },

  async joinChannel(channelId: string) {
    const res = await api.post(`/conversations/${channelId}/join`);
    return res.data;
  },

  async updateChannelVisibility(channelId: string, isPublic: boolean) {
    const res = await api.patch(`/conversations/${channelId}/visibility`, { isPublic });
    return res.data;
  },

  async banGroupMember(id: string, memberId: string, duration?: number | null) {
    const res = await api.post(`/conversations/${id}/members/ban`, { memberId, duration });
    return res.data;
  },

  async deleteConversation(id: string, password?: string) {
    const res = await api.delete(`/conversations/${id}`, { data: { password } });
    return res.data;
  },

  async getChannelPreview(id: string) {
    const res = await api.get(`/conversations/preview/${id}`);
    return res.data;
  },

  async explorePublicChannels(q: string = "") {
    const res = await api.get(`/conversations/channels/explore?q=${encodeURIComponent(q)}`);
    return res.data;
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

  async uploadFile(formData: FormData): Promise<{ fileUrl: string, fileName: string, fileSize: number }> {
    const res = await api.post("/messages/upload-file", formData, {
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

  async translateMessage(messageId: string, targetLang: string = "vi") {
    const res = await api.post(`/messages/${messageId}/translate`, { targetLang });
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

  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.post(`/conversations/${conversationId}/members`, { memberIds });
    return res.data;
  },

  async removeGroupMember(conversationId: string, memberId: string) {
    const res = await api.delete(`/conversations/${conversationId}/members/${memberId}`);
    return res.data;
  },

  async updateGroupRole(conversationId: string, memberId: string, role: "leader" | "member" | "deputy") {
    const res = await api.patch(`/conversations/${conversationId}/role`, { memberId, role });
    return res.data;
  },

  async updateGroupInfo(conversationId: string, name?: string, description?: string) {
    const res = await api.patch(`/conversations/${conversationId}/info`, { name, description });
    return res.data;
  },

  async updateGroupAvatar(conversationId: string, formData: FormData) {
    const res = await api.post(`/conversations/${conversationId}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async removeGroupAvatar(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}/avatar`);
    return res.data;
  },

  async voteOnPoll(messageId: string, optionIndex: number) {
    const res = await api.post(`/messages/${messageId}/vote`, { optionIndex });
    return res.data;
  },



  clearChatHistory: async (conversationId: string) => {
    const response = await api.post(`/conversations/${conversationId}/clear`);
    return response.data;
  },

  leaveGroup: async (conversationId: string) => {
    const response = await api.post(`/conversations/${conversationId}/leave`);
    return response.data;
  },

  summarizeChat: async (conversationId: string) => {
    const response = await api.get(`/conversations/${conversationId}/summarize`);
    return response.data;
  },

  scheduleMessage: async (payload: {
    conversationId: string;
    recipientId?: string;
    content?: string;
    imgUrl?: string | null;
    audioUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    mentions?: string[];
    scheduledFor: string | Date;
    title?: string;
    type?: "direct" | "group" | "reminder";
  }) => {
    const res = await api.post("/messages/schedule", payload);
    return res.data;
  },

  getScheduledMessages: async (conversationId?: string) => {
    const url = conversationId ? `/messages/scheduled/${conversationId}` : "/messages/scheduled";
    const res = await api.get(url);
    return res.data;
  },

  cancelScheduledMessage: async (id: string) => {
    const res = await api.delete(`/messages/scheduled/${id}`);
    return res.data;
  },

  updateScheduledMessage: async (id: string, payload: { content?: string; scheduledFor?: string | Date; title?: string }) => {
    const res = await api.put(`/messages/scheduled/${id}`, payload);
    return res.data;
  },
};