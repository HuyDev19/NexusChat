import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
  uploadCover: async (formData: FormData) => {
    const res = await api.post("/users/uploadCover", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },
  updateNote: async (content: string, expiresInHours?: number) => {
    const res = await api.put("/users/note", { content, expiresInHours });
    return res.data;
  },
  updateProfile: async (data: { displayName?: string; phone?: string; bio?: string }) => {
    const res = await api.put("/users/me", data);
    return res.data;
  },
  fetchUserProfile: async (userId: string) => {
    const res = await api.get(`/users/${userId}`);
    return res.data.user;
  },
  lockConversation: async (conversationId: string, pin: string) => {
    const res = await api.post(`/users/lock-conversation/${conversationId}`, { pin });
    return res.data;
  },
  verifyLock: async (conversationId: string, pin: string) => {
    const res = await api.post(`/users/verify-lock/${conversationId}`, { pin });
    return res.data;
  },
  resetLock: async (conversationId: string, password: string, newPin?: string) => {
    const res = await api.post(`/users/reset-lock/${conversationId}`, { password, newPin });
    return res.data;
  },
  blockUser: async (userId: string) => {
    const res = await api.post(`/users/${userId}/block`);
    return res.data;
  },
  unblockUser: async (userId: string) => {
    const res = await api.post(`/users/${userId}/unblock`);
    return res.data;
  },
  getBlockedUsers: async () => {
    const res = await api.get("/users/me/blocked");
    return res.data.blockedUsers;
  },
  changePasswordWithOtp: async (otp: string, newPassword: string) => {
    const res = await api.post("/users/change-password", { otp, newPassword });
    return res.data;
  },
  deleteAccountWithOtp: async (otp: string) => {
    const res = await api.delete("/users/me", { data: { otp } });
    return res.data;
  },
};