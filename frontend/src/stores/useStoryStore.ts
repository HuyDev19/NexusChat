import { create } from "zustand";
import { storyService } from "@/services/storyService";

export interface Story {
  _id: string;
  userId: any; // User object
  mediaUrl: string;
  mediaType: "image" | "video";
  music?: {
    title: string;
    artist: string;
    coverUrl: string;
    previewUrl: string;
  };
  viewers: any[];
  reactions: {
    userId: any;
    emoji: string;
    createdAt: string;
  }[];
  expiresAt: string;
  createdAt: string;
}

export interface UserStoryGroup {
  user: any; // User object
  stories: Story[];
  allViewed: boolean;
}

interface StoryState {
  storyGroups: UserStoryGroup[];
  loading: boolean;
  fetchStories: () => Promise<void>;
  viewStory: (storyId: string) => Promise<void>;
  createStory: (formData: FormData) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  reactStory: (storyId: string, emoji: string) => Promise<void>;
  addOrUpdateStoryFromSocket: (story: Story) => void;
  addStoryViewer: (storyId: string, viewer: any) => void;
  addStoryReaction: (storyId: string, reaction: any) => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  storyGroups: [],
  loading: false,

  fetchStories: async () => {
    try {
      set({ loading: true });
      const data = await storyService.fetchStories();
      set({ storyGroups: data });
    } catch (error) {
      console.error("Lỗi khi fetch stories:", error);
    } finally {
      set({ loading: false });
    }
  },

  viewStory: async (storyId) => {
    try {
      await storyService.viewStory(storyId);
      // Update local state to mark as viewed (optimistic update could be done here if needed)
    } catch (error) {
      console.error("Lỗi khi đánh dấu xem story:", error);
    }
  },

  createStory: async (formData) => {
    try {
      set({ loading: true });
      await storyService.createStory(formData);
      // The socket event will trigger `addOrUpdateStoryFromSocket`
    } catch (error) {
      console.error("Lỗi khi tạo story:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteStory: async (storyId) => {
    try {
      await storyService.deleteStory(storyId);
      await get().fetchStories(); // Refetch or filter local state
    } catch (error) {
      console.error("Lỗi khi xoá story:", error);
    }
  },

  reactStory: async (storyId, emoji) => {
    try {
      await storyService.reactStory(storyId, emoji);
    } catch (error) {
      console.error("Lỗi khi thả cảm xúc:", error);
    }
  },

  addOrUpdateStoryFromSocket: (story) => {
    set((state) => {
      const groups = [...state.storyGroups];
      const userId = typeof story.userId === "string" ? story.userId : story.userId._id;
      
      const existingGroupIndex = groups.findIndex(g => g.user._id === userId);
      
      if (existingGroupIndex >= 0) {
        // Group exists, append story
        groups[existingGroupIndex] = {
          ...groups[existingGroupIndex],
          stories: [...groups[existingGroupIndex].stories, story],
          allViewed: false, // new story means not all viewed
        };
      } else {
        // Create new group
        groups.unshift({
          user: story.userId,
          stories: [story],
          allViewed: false,
        });
      }
      return { storyGroups: groups };
    });
  },

  addStoryViewer: (storyId, viewer) => {
    set((state) => {
      const groups = [...state.storyGroups];
      groups.forEach(g => {
        const s = g.stories.find(x => x._id === storyId);
        if (s && !s.viewers.some(v => v._id === viewer._id)) {
          s.viewers.push(viewer);
        }
      });
      return { storyGroups: groups };
    });
  },

  addStoryReaction: (storyId, reaction) => {
    set((state) => {
      const groups = [...state.storyGroups];
      groups.forEach(g => {
        const s = g.stories.find(x => x._id === storyId);
        if (s) {
          if (!s.reactions) s.reactions = [];
          if (!s.reactions.some(r => r.userId._id === reaction.userId._id && r.emoji === reaction.emoji)) {
            s.reactions.push(reaction);
          }
        }
      });
      return { storyGroups: groups };
    });
  },
}));
