import { create } from "zustand";
import { userService } from "@/services/userService";

export interface PhotoReaction {
  userId: string;
  emoji: string;
}

export interface ProfilePhoto {
  _id: string;
  url: string;
  publicId?: string;
  caption?: string;
  createdAt: string;
  reactions?: PhotoReaction[];
}

export interface UserAccountInfo {
  _id: string;
  displayName: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  presenceStatus?: "online" | "offline" | "busy";
  lastActiveAt?: string | null;
  createdAt?: string;
  photos?: ProfilePhoto[];
  note?: {
    content: string;
    expiresAt: string | null;
  } | string;
}

interface AccountInfoModalState {
  isOpen: boolean;
  userId: string | null;
  user: UserAccountInfo | null;
  loading: boolean;
  openAccountModal: (userId: string) => Promise<void>;
  closeAccountModal: () => void;
  setUserPhotos: (photos: ProfilePhoto[]) => void;
  updatePhotoReactions: (photoId: string, reactions: PhotoReaction[]) => void;
}

export const useAccountInfoModalStore = create<AccountInfoModalState>((set) => ({
  isOpen: false,
  userId: null,
  user: null,
  loading: false,

  openAccountModal: async (userId: string) => {
    set({ isOpen: true, userId, loading: true });
    try {
      const user = await userService.fetchUserProfile(userId);
      set({ user, loading: false });
    } catch (error) {
      console.error("Lỗi lấy thông tin tài khoản:", error);
      set({ loading: false, user: null });
    }
  },

  closeAccountModal: () => {
    set({ isOpen: false });
  },

  setUserPhotos: (photos: ProfilePhoto[]) => {
    set((state) => (state.user ? { user: { ...state.user, photos } } : state));
  },

  updatePhotoReactions: (photoId: string, reactions: PhotoReaction[]) => {
    set((state) => {
      if (!state.user || !state.user.photos) return state;
      const updatedPhotos = state.user.photos.map((p) =>
        p._id === photoId ? { ...p, reactions } : p
      );
      return { user: { ...state.user, photos: updatedPhotos } };
    });
  },
}));
