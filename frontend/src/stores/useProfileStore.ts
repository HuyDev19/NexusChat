import { create } from "zustand";
import { userService } from "@/services/userService";

interface UserProfile {
  _id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  presenceStatus?: "online" | "offline" | "busy";
  createdAt?: string;
}

interface ProfileStore {
  isOpen: boolean;
  mode: "user" | "chat";
  selectedUserId: string | null;
  profileData: UserProfile | null;
  loading: boolean;
  
  openProfile: (userId: string) => Promise<void>;
  openChatDetails: (userId?: string) => Promise<void>;
  closeProfile: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  isOpen: false,
  mode: "user",
  selectedUserId: null,
  profileData: null,
  loading: false,

  openProfile: async (userId: string) => {
    // Nếu click lại người đó khi đang đóng, hoặc click người khác
    set({ isOpen: true, mode: "user", selectedUserId: userId, loading: true });
    try {
      const user = await userService.fetchUserProfile(userId);
      set({ profileData: user, loading: false });
    } catch (error) {
      console.error("Lỗi lấy thông tin profile:", error);
      set({ loading: false, profileData: null });
    }
  },

  openChatDetails: async (userId?: string) => {
    set({ isOpen: true, mode: "chat", selectedUserId: userId || null, loading: !!userId });
    if (userId) {
      try {
        const user = await userService.fetchUserProfile(userId);
        set({ profileData: user, loading: false });
      } catch (error) {
        console.error("Lỗi lấy thông tin profile:", error);
        set({ loading: false, profileData: null });
      }
    } else {
      set({ profileData: null });
    }
  },

  closeProfile: () => {
    set({ isOpen: false });
    // Không xoá selectedUserId và profileData vội để animation đóng mượt mà
  },
}));
