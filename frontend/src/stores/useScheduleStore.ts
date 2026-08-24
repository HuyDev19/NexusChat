import { create } from "zustand";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";

export interface ScheduledMessageItem {
  _id: string;
  conversationId: any;
  senderId: any;
  recipientId?: any;
  type: "direct" | "group" | "reminder";
  title?: string | null;
  content: string;
  imgUrl?: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mentions?: string[];
  scheduledFor: string;
  status: "pending" | "sent" | "cancelled" | "failed";
  createdAt: string;
  updatedAt: string;
}

interface ScheduleState {
  isOpen: boolean;
  activeConvoId: string | null;
  scheduledList: ScheduledMessageItem[];
  loading: boolean;
  openScheduleModal: (convoId?: string) => void;
  closeScheduleModal: () => void;
  fetchScheduledMessages: (convoId?: string) => Promise<void>;
  createSchedule: (payload: {
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
  }) => Promise<boolean>;
  cancelSchedule: (id: string) => Promise<boolean>;
  handleExecutedEvent: (scheduledId: string) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  isOpen: false,
  activeConvoId: null,
  scheduledList: [],
  loading: false,

  openScheduleModal: (convoId) => {
    set({ isOpen: true, activeConvoId: convoId || null });
    get().fetchScheduledMessages(convoId);
  },

  closeScheduleModal: () => {
    set({ isOpen: false });
  },

  fetchScheduledMessages: async (convoId) => {
    try {
      set({ loading: true });
      const data = await chatService.getScheduledMessages(convoId);
      set({ scheduledList: data.scheduledMessages || [] });
    } catch (error) {
      console.error("Lỗi khi tải danh sách tin nhắn hẹn giờ:", error);
    } finally {
      set({ loading: false });
    }
  },

  createSchedule: async (payload) => {
    try {
      set({ loading: true });
      const data = await chatService.scheduleMessage(payload);
      toast.success("Đã lên lịch tin nhắn thành công!");
      // Add to list
      if (data.scheduledMessage) {
        set((state) => ({
          scheduledList: [...state.scheduledList, data.scheduledMessage].sort(
            (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
          ),
        }));
      }
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi lên lịch tin nhắn");
      return false;
    } finally {
      set({ loading: false });
    }
  },

  cancelSchedule: async (id) => {
    try {
      await chatService.cancelScheduledMessage(id);
      toast.success("Đã hủy tin nhắn hẹn giờ");
      set((state) => ({
        scheduledList: state.scheduledList.filter((item) => item._id !== id),
      }));
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi hủy lịch gửi");
      return false;
    }
  },

  handleExecutedEvent: (scheduledId) => {
    set((state) => ({
      scheduledList: state.scheduledList.filter((item) => item._id !== scheduledId),
    }));
  },
}));
