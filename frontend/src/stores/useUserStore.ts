import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
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
  }
}));
