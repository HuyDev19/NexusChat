import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>(() => ({
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({
          ...user,
          avatarUrl: data.avatarUrl,
        });

        useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi khi updateAvatarUrl", error);
      toast.error("Upload avatar không thành công!");
    }
  },
  removeAvatar: async () => {
    try {
      const { user, setUser } = useAuthStore.getState();
      await userService.removeAvatar();

      if (user) {
        setUser({
          ...user,
          avatarUrl: undefined,
        });

        useChatStore.getState().fetchConversations();
        toast.success("Đã gỡ ảnh đại diện!");
      }
    } catch (error) {
      console.error("Lỗi khi removeAvatar", error);
      toast.error("Gỡ ảnh đại diện không thành công!");
    }
  },
  updateCoverUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadCover(formData);

      if (user) {
        setUser({
          ...user,
          coverUrl: data.coverUrl,
        });

        useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Lỗi khi updateCoverUrl", error);
      toast.error("Upload ảnh bìa không thành công!");
    }
  },
  updateNote: async (content, expiresInHours) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.updateNote(content, expiresInHours);

      if (user) {
        setUser({
          ...user,
          note: data.note,
        });
        toast.success("Cập nhật ghi chú thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi updateNote", error);
      toast.error("Cập nhật ghi chú thất bại!");
    }
  },
  updateProfile: async (data) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const resData = await userService.updateProfile(data);

      if (user && resData.user) {
        setUser({
          ...user,
          ...resData.user,
        });
        toast.success("Cập nhật thông tin thành công!");
      }
    } catch (error) {
      console.error("Lỗi khi updateProfile", error);
      toast.error("Cập nhật thông tin thất bại!");
    }
  },
  toggleReadReceipts: async (enabled) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const resData = await userService.toggleReadReceipts(enabled);

      if (user) {
        setUser({
          ...user,
          readReceipts: resData.readReceipts,
        });
        toast.success(enabled ? "Đã bật thông báo đã đọc!" : "Đã tắt thông báo đã đọc!");
      }
    } catch (error) {
      console.error("Lỗi khi toggleReadReceipts", error);
      toast.error("Cập nhật cài đặt thất bại!");
    }
  }
}));
