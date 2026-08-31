import api from "@/lib/axios";

export const storyService = {
  async fetchStories() {
    const res = await api.get("/stories");
    return res.data.data;
  },

  async createStory(formData: FormData) {
    const res = await api.post("/stories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async viewStory(storyId: string) {
    const res = await api.post(`/stories/${storyId}/view`);
    return res.data;
  },

  async deleteStory(storyId: string) {
    const res = await api.delete(`/stories/${storyId}`);
    return res.data;
  },

  async reactStory(storyId: string, emoji: string) {
    const res = await api.post(`/stories/${storyId}/react`, { emoji });
    return res.data;
  },
};
