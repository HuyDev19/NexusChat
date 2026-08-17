import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setUser: (user) => {
        set({ user });
      },
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset();
        localStorage.clear();
        sessionStorage.clear();
      },
      signUp: async (username, password, email, firstName, lastName, otp) => {
        try {
          set({ loading: true });

          await authService.signUp(
            username,
            password,
            email,
            firstName,
            lastName,
            otp
          );

          toast.success(
            "Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.",
          );
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Đăng ký không thành công");
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      sendOtp: async (email, type) => {
        try {
          const res = await authService.sendOtp(email, type);
          toast.success(res.message || "Đã gửi mã OTP đến email của bạn!");
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Lỗi khi gửi mã OTP");
          throw error;
        }
      },
      verifyOtp: async (email, otp, type) => {
        try {
          const res = await authService.verifyOtp(email, otp, type);
          toast.success(res.message || "Xác thực mã OTP thành công!");
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Mã OTP không hợp lệ");
          throw error;
        }
      },
      resetPassword: async (email, otp, newPassword) => {
        try {
          const res = await authService.resetPassword(email, otp, newPassword);
          toast.success(res.message || "Đặt lại mật khẩu thành công!");
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Không thể đặt lại mật khẩu");
          throw error;
        }
      },
      changePassword: async (otp, newPassword) => {
        try {
          const res = await userService.changePasswordWithOtp(otp, newPassword);
          toast.success(res.message || "Đổi mật khẩu thành công!");
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
          throw error;
        }
      },
      deleteAccount: async (otp) => {
        try {
          await userService.deleteAccountWithOtp(otp);
          toast.success("Đã xoá tài khoản thành công!");
          get().clearState();
        } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Xoá tài khoản thất bại");
          throw error;
        }
      },
      signIn: async (username, password) => {
        try {
          get().clearState();
          set({ loading: true });

          const { accessToken } = await authService.signIn(username, password);
          get().setAccessToken(accessToken);

          await get().fetchMe();
          useChatStore.getState().fetchConversations();

          toast.success("Chào mừng bạn quay lại với NexusChat 🎉");
        } catch (error) {
          console.error(error);
          toast.error("Đăng nhập không thành công!");
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Logout thành công!");
        } catch (error) {
          console.error(error);
          toast.error("Lỗi xảy ra khi logout. Hãy thử lại!");
        }
      },
      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();

          set({ user });
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
        } finally {
          set({ loading: false });
        }
      },
      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);

          if (!user) {
            await fetchMe();
          }
        } catch (error) {
          console.error(error);
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
      blockUser: async (userId: string) => {
        try {
          const res = await userService.blockUser(userId);
          const { user } = get();
          if (user) {
            set({ user: { ...user, blockedUsers: res.blockedUsers } });
          }
          toast.success("Đã chặn người dùng");
        } catch (error) {
          console.error("Lỗi chặn người dùng:", error);
          toast.error("Lỗi khi chặn người dùng");
        }
      },
      unblockUser: async (userId: string) => {
        try {
          const res = await userService.unblockUser(userId);
          const { user } = get();
          if (user) {
            set({ user: { ...user, blockedUsers: res.blockedUsers } });
          }
          toast.success("Đã bỏ chặn người dùng");
        } catch (error) {
          console.error("Lỗi bỏ chặn người dùng:", error);
          toast.error("Lỗi khi bỏ chặn người dùng");
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    },
  ),
);
