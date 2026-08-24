import { create } from "zustand";

export interface MediaItem {
  _id: string;
  url: string;
  senderName?: string;
  senderAvatar?: string | null;
  createdAt?: string | Date;
  content?: string;
  conversationId?: string;
}

interface MediaViewerState {
  isOpen: boolean;
  currentIndex: number;
  items: MediaItem[];
  openViewer: (items: MediaItem[], startIndex?: number) => void;
  openSingle: (
    url: string,
    title?: string,
    senderName?: string,
    senderAvatar?: string | null,
    createdAt?: string | Date
  ) => void;
  closeViewer: () => void;
  nextImage: () => void;
  prevImage: () => void;
  setIndex: (index: number) => void;
}

export const useMediaViewerStore = create<MediaViewerState>((set, get) => ({
  isOpen: false,
  currentIndex: 0,
  items: [],

  openViewer: (items, startIndex = 0) => {
    if (!items || items.length === 0) return;
    const validIndex = Math.max(0, Math.min(startIndex, items.length - 1));
    set({
      isOpen: true,
      items,
      currentIndex: validIndex,
    });
  },

  openSingle: (url, title, senderName, senderAvatar, createdAt) => {
    if (!url) return;
    set({
      isOpen: true,
      currentIndex: 0,
      items: [
        {
          _id: `single-${Date.now()}`,
          url,
          senderName: senderName || title || "Hình ảnh",
          senderAvatar: senderAvatar || null,
          createdAt: createdAt || new Date(),
        },
      ],
    });
  },

  closeViewer: () => {
    set({ isOpen: false, items: [], currentIndex: 0 });
  },

  nextImage: () => {
    const { currentIndex, items } = get();
    if (currentIndex < items.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevImage: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  setIndex: (index) => {
    const { items } = get();
    if (index >= 0 && index < items.length) {
      set({ currentIndex: index });
    }
  },
}));
