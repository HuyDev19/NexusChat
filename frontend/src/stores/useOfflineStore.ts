import { create } from "zustand";
import { offlineSyncService, type OfflineOutboxItem } from "@/services/offlineSyncService";
import { chatService } from "@/services/chatService";
import { useChatStore } from "./useChatStore";
import { toast } from "sonner";

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  outbox: OfflineOutboxItem[];
  setOnlineStatus: (status: boolean) => void;
  loadOutbox: () => void;
  queueOfflineMessage: (item: OfflineOutboxItem) => void;
  syncOutbox: () => Promise<void>;
  initListeners: () => () => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  outbox: offlineSyncService.getOutbox(),

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    if (status) {
      get().syncOutbox();
    }
  },

  loadOutbox: () => {
    set({ outbox: offlineSyncService.getOutbox() });
  },

  queueOfflineMessage: (item: OfflineOutboxItem) => {
    offlineSyncService.addToOutbox(item);
    set({ outbox: offlineSyncService.getOutbox() });
    toast.info("Đã lưu vào hàng đợi gửi ngoại tuyến. Tin nhắn sẽ tự động gửi khi có mạng!");
  },

  syncOutbox: async () => {
    const { isSyncing } = get();
    if (isSyncing) return;

    const outbox = offlineSyncService.getOutbox();
    if (outbox.length === 0) return;

    set({ isSyncing: true });
    toast.loading(`Đang đồng bộ ${outbox.length} tin nhắn ngoại tuyến...`, { id: "offline-sync" });

    let successCount = 0;

    for (const item of outbox) {
      try {
        if (item.type === "direct") {
          await chatService.sendDirectMessage(
            item.recipientId || "",
            item.content,
            item.imgUrl,
            item.conversationId,
            item.audioUrl,
            undefined,
            false,
            item.mentions,
            item.replyTo,
            false,
            item.fileUrl,
            item.fileName,
            item.fileSize
          );
        } else {
          await chatService.sendGroupMessage(
            item.conversationId,
            item.content,
            item.imgUrl,
            item.audioUrl,
            undefined,
            false,
            undefined,
            item.mentions,
            item.replyTo,
            false,
            item.fileUrl,
            item.fileName,
            item.fileSize
          );
        }

        offlineSyncService.removeFromOutbox(item.tempId);
        successCount++;
      } catch (err) {
        console.error(`Lỗi khi đồng bộ tin nhắn ngoại tuyến ${item.tempId}:`, err);
        // Keep in outbox to retry next time
      }
    }

    set({ isSyncing: false, outbox: offlineSyncService.getOutbox() });
    toast.dismiss("offline-sync");

    if (successCount > 0) {
      toast.success(`Đã đồng bộ thành công ${successCount} tin nhắn ngoại tuyến!`);
      // Refresh active messages
      const activeConvoId = useChatStore.getState().activeConversationId;
      if (activeConvoId) {
        useChatStore.getState().fetchMessages(activeConvoId);
      }
    }
  },

  initListeners: () => {
    const handleOnline = () => {
      console.log("[OfflineEngine] Trình duyệt đã kết nối mạng trở lại");
      get().setOnlineStatus(true);
    };

    const handleOffline = () => {
      console.log("[OfflineEngine] Trình duyệt mất kết nối mạng");
      get().setOnlineStatus(false);
      toast.warning("Bạn đang ở chế độ ngoại tuyến. Các tin nhắn sẽ được lưu vào hàng đợi.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    get().loadOutbox();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  },
}));
