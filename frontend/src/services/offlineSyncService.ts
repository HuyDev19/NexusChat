import type { Conversation, Message } from "@/types/chat";

const CACHE_CONVERSATIONS_KEY = "nexus_cache_conversations";
const CACHE_MESSAGES_PREFIX = "nexus_cache_msgs_";
const OFFLINE_OUTBOX_KEY = "nexus_offline_outbox";

export interface OfflineOutboxItem {
  tempId: string;
  conversationId: string;
  recipientId?: string;
  type: "direct" | "group";
  content: string;
  imgUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mentions?: string[];
  replyTo?: string;
  createdAt: string;
}

export const offlineSyncService = {
  // 1. Caching Conversations
  saveConversationsCache: (conversations: Conversation[]) => {
    try {
      localStorage.setItem(CACHE_CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn("Failed to cache conversations:", e);
    }
  },

  getConversationsCache: (): Conversation[] => {
    try {
      const data = localStorage.getItem(CACHE_CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 2. Caching Messages per conversation
  saveMessagesCache: (conversationId: string, messages: Message[]) => {
    try {
      // Keep most recent 100 messages in cache per conversation
      const subset = messages.slice(-100);
      localStorage.setItem(`${CACHE_MESSAGES_PREFIX}${conversationId}`, JSON.stringify(subset));
    } catch (e) {
      console.warn(`Failed to cache messages for convo ${conversationId}:`, e);
    }
  },

  getMessagesCache: (conversationId: string): Message[] => {
    try {
      const data = localStorage.getItem(`${CACHE_MESSAGES_PREFIX}${conversationId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // 3. Offline Outbox Queue
  getOutbox: (): OfflineOutboxItem[] => {
    try {
      const data = localStorage.getItem(OFFLINE_OUTBOX_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToOutbox: (item: OfflineOutboxItem) => {
    try {
      const current = offlineSyncService.getOutbox();
      current.push(item);
      localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn("Failed to add to offline outbox:", e);
    }
  },

  removeFromOutbox: (tempId: string) => {
    try {
      const current = offlineSyncService.getOutbox();
      const filtered = current.filter((item) => item.tempId !== tempId);
      localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Failed to remove from offline outbox:", e);
    }
  },

  clearOutbox: () => {
    try {
      localStorage.removeItem(OFFLINE_OUTBOX_KEY);
    } catch {}
  },
};
