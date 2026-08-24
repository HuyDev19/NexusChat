import api from "@/lib/axios";

export const authService = {
  checkUsername: async (username: string) => {
    const res = await api.post("/auth/check-username", { username });
    return res.data;
  },

  checkEmail: async (email: string) => {
    const res = await api.post("/auth/check-email", { email });
    return res.data;
  },

  sendOtp: async (
    email: string,
    type: "register" | "reset_password" | "change_password" | "delete_account"
  ) => {
    const res = await api.post(
      "/auth/send-otp",
      { email, type },
      { withCredentials: true }
    );
    return res.data;
  },

  verifyOtp: async (
    email: string,
    otp: string,
    type: "register" | "reset_password" | "change_password" | "delete_account"
  ) => {
    const res = await api.post(
      "/auth/verify-otp",
      { email, otp, type },
      { withCredentials: true }
    );
    return res.data;
  },

  signUp: async (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    otp: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, email, firstName, lastName, otp },
      { withCredentials: true }
    );

    return res.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const res = await api.post(
      "/auth/reset-password",
      { email, otp, newPassword },
      { withCredentials: true }
    );
    return res.data;
  },

  signIn: async (username: string, password: string) => {
    const res = await api.post(
      "/auth/signin",
      { username, password },
      { withCredentials: true }
    );
    return res.data;
  },

  signOut: async () => {
    return api.post("/auth/signout", { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data.user;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data.accessToken;
  },
};