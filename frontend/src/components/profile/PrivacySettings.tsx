import { useState, useEffect } from "react";
import { Shield, Bell, ShieldBan, KeyRound, Loader2, Mail, RotateCcw, X, UserX, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { userService } from "@/services/userService";
import UserAvatar from "../chat/UserAvatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlockedUser {
  _id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
}

const PrivacySettings = () => {
  const { user, sendOtp, changePassword, deleteAccount, unblockUser } = useAuthStore();

  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("desktop_notifications") !== "disabled" && Notification.permission === "granted";
  });

  // Modals visibility
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Change Password State (Inline)
  const [changePwStep, setChangePwStep] = useState<1 | 2>(1);
  const [pwOtp, setPwOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwTimer, setPwTimer] = useState(0);
  const [isPwLoading, setIsPwLoading] = useState(false);

  // Blocked Users List State
  const [blockedUsersList, setBlockedUsersList] = useState<BlockedUser[]>([]);
  const [isFetchingBlocked, setIsFetchingBlocked] = useState(false);

  // Delete Account State
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteTimer, setDeleteTimer] = useState(0);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Timers
  useEffect(() => {
    if (pwTimer <= 0) return;
    const interval = setInterval(() => setPwTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [pwTimer]);

  useEffect(() => {
    if (deleteTimer <= 0) return;
    const interval = setInterval(() => setDeleteTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [deleteTimer]);

  // Handle Desktop Notification Toggle
  const handleToggleNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Trình duyệt của bạn không hỗ trợ thông báo đẩy!");
      return;
    }

    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        localStorage.setItem("desktop_notifications", "enabled");
        setNotificationsEnabled(true);
        toast.success("Đã bật thông báo đẩy trình duyệt!");
      } else {
        toast.error("Bạn chưa cấp quyền thông báo cho trình duyệt.");
      }
    } else {
      localStorage.setItem("desktop_notifications", "disabled");
      setNotificationsEnabled(false);
      toast.info("Đã tắt thông báo đẩy trình duyệt.");
    }
  };

  // Change Password Handlers
  const handleSendPwOtp = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.email) return;
    try {
      setIsPwLoading(true);
      await sendOtp(user.email, "change_password");
      setChangePwStep(2);
      setPwTimer(60);
    } catch (error) {
      // error handled in store
    } finally {
      setIsPwLoading(false);
    }
  };

  const handleConfirmChangePassword = async () => {
    if (!pwOtp || pwOtp.trim().length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP!");
      return;
    }
    if (!newPw || newPw.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      setIsPwLoading(true);
      await changePassword(pwOtp.trim(), newPw);
      setChangePwStep(1);
      setPwOtp("");
      setNewPw("");
      setConfirmPw("");
    } catch (error) {
      // error handled in store
    } finally {
      setIsPwLoading(false);
    }
  };

  // Open Blocked Users Modal & Fetch List
  const handleOpenBlockedModal = async () => {
    setShowBlockedModal(true);
    try {
      setIsFetchingBlocked(true);
      const list = await userService.getBlockedUsers();
      setBlockedUsersList(list);
    } catch (error) {
      console.error("Lỗi lấy danh sách chặn:", error);
      toast.error("Không thể tải danh sách chặn");
    } finally {
      setIsFetchingBlocked(false);
    }
  };

  // Unblock Handler inside Modal
  const handleUnblockUser = async (targetId: string) => {
    try {
      await unblockUser(targetId);
      setBlockedUsersList((prev) => prev.filter((u) => u._id !== targetId));
    } catch (error) {
      // error handled in store
    }
  };

  // Delete Account Handlers
  const handleSendDeleteOtp = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!user?.email) return;
    try {
      setIsDeleteLoading(true);
      await sendOtp(user.email, "delete_account");
      setDeleteStep(2);
      setDeleteTimer(60);
    } catch (error) {
      // error handled in store
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteOtp || deleteOtp.trim().length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP!");
      return;
    }

    try {
      setIsDeleteLoading(true);
      await deleteAccount(deleteOtp.trim());
      setShowDeleteModal(false);
      window.location.href = "/signup";
    } catch (error) {
      // error handled in store
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30 relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-400" />
          Quyền riêng tư & Bảo mật
        </CardTitle>
        <CardDescription>
          Quản lý cài đặt quyền riêng tư và bảo mật của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ========================================================= */}
        {/* SECTION 1: ĐỔI MẬT KHẨU (TRỰC TIẾP TRONG TAB)               */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs flex items-center gap-2 text-foreground">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Đổi mật khẩu tài khoản</span>
            </h4>
            <span className="text-[10px] text-muted-foreground font-medium">Xác thực OTP qua Gmail</span>
          </div>

          {changePwStep === 1 ? (
            <div className="flex items-center justify-between pt-1 gap-2">
              <span className="text-xs text-muted-foreground truncate">
                Email nhận mã: <strong className="text-purple-400 font-semibold">{user?.email}</strong>
              </span>
              <Button
                type="button"
                onClick={handleSendPwOtp}
                disabled={isPwLoading}
                size="sm"
                className="h-8 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-1.5 font-medium shrink-0 rounded-xl"
              >
                {isPwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>Gửi mã OTP</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
                <span>Mã OTP 6 chữ số đã gửi tới <strong>{user?.email}</strong></span>
                <button
                  type="button"
                  disabled={pwTimer > 0 || isPwLoading}
                  onClick={handleSendPwOtp}
                  className={cn("flex items-center gap-1 text-[11px] font-medium", pwTimer > 0 ? "text-muted-foreground" : "text-purple-400 hover:underline")}
                >
                  <RotateCcw className={cn("w-3 h-3", isPwLoading && "animate-spin")} />
                  <span>{pwTimer > 0 ? `Gửi lại (${pwTimer}s)` : "Gửi lại OTP"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="inline-pw-otp" className="text-[10px] uppercase text-muted-foreground font-semibold">Mã OTP (6 số)</Label>
                  <Input
                    id="inline-pw-otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={pwOtp}
                    onChange={(e) => setPwOtp(e.target.value.replace(/\D/g, ""))}
                    className="h-8.5 text-xs text-center font-bold tracking-[4px] bg-purple-950/20 border-purple-500/40 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inline-new-pw" className="text-[10px] uppercase text-muted-foreground font-semibold">Mật khẩu mới</Label>
                  <Input
                    id="inline-new-pw"
                    type="password"
                    placeholder="••••••••"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="h-8.5 text-xs bg-muted/30"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inline-confirm-pw" className="text-[10px] uppercase text-muted-foreground font-semibold">Xác nhận mật khẩu</Label>
                  <Input
                    id="inline-confirm-pw"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className="h-8.5 text-xs bg-muted/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setChangePwStep(1)}
                  className="h-8 text-xs rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmChangePassword}
                  disabled={isPwLoading || pwOtp.length !== 6 || !newPw || !confirmPw}
                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5 font-medium rounded-xl shadow-md shadow-purple-600/20"
                >
                  {isPwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Lưu mật khẩu mới</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SECTION 2 & 3: CÀI ĐẶT THÔNG BÁO VÀ DANH SÁCH CHẶN        */}
        {/* ========================================================= */}
        <div className="space-y-2.5">
          {/* Cài đặt thông báo */}
          <Button
            variant="outline"
            onClick={handleToggleNotifications}
            className="w-full justify-between glass-light border-border/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-xs h-10 px-4 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-400" />
              <span>Cài đặt thông báo trình duyệt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("text-[11px] font-medium", notificationsEnabled ? "text-green-400" : "text-muted-foreground")}>
                {notificationsEnabled ? "Đã bật" : "Đã tắt"}
              </span>
              <div className={cn("w-2 h-2 rounded-full", notificationsEnabled ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
            </div>
          </Button>

          {/* Danh sách chặn */}
          <Button
            variant="outline"
            onClick={handleOpenBlockedModal}
            className="w-full justify-between glass-light border-border/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-xs h-10 px-4 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <ShieldBan className="h-4 w-4 text-rose-400" />
              <span>Danh sách chặn</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              {user?.blockedUsers?.length || 0} người dùng
            </span>
          </Button>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: KHU VỰC NGUY HIỂM - XOÁ TÀI KHOẢN             */}
        {/* ========================================================= */}
        <div className="pt-3 border-t border-border/30 space-y-2.5">
          <h4 className="font-medium text-xs text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Khu vực nguy hiểm
          </h4>
          <Button
            variant="destructive"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteStep(1);
            }}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-10 rounded-xl shadow-md shadow-rose-600/20 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xoá tài khoản vĩnh viễn</span>
          </Button>
        </div>
      </CardContent>

      {/* ========================================================= */}
      {/* MODAL DANH SÁCH CHẶN                                       */}
      {/* ========================================================= */}
      {showBlockedModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-md bg-card/95 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-foreground max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldBan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Danh sách chặn</h3>
                  <p className="text-[11px] text-muted-foreground">Quản lý những người bạn đã chặn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockedModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[160px]">
              {isFetchingBlocked ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  <span>Đang tải danh sách chặn...</span>
                </div>
              ) : blockedUsersList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-xs">
                  <UserX className="w-8 h-8 opacity-40 text-rose-400" />
                  <span>Chưa có người dùng nào bị chặn.</span>
                </div>
              ) : (
                blockedUsersList.map((blocked) => (
                  <div
                    key={blocked._id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        type="chat"
                        name={blocked.displayName}
                        avatarUrl={blocked.avatarUrl || undefined}
                        className="w-10 h-10"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">{blocked.displayName}</span>
                        <span className="text-[10px] text-muted-foreground">@{blocked.username}</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockUser(blocked._id)}
                      className="h-8 text-xs rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      Bỏ chặn
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL XOÁ TÀI KHOẢN                                       */}
      {/* ========================================================= */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-md bg-card/95 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-rose-500">Xoá tài khoản vĩnh viễn</h3>
                  <p className="text-[11px] text-muted-foreground">Cần xác thực mã OTP gửi về Gmail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                Cảnh báo quan trọng:
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Tài khoản của bạn sẽ bị xóa hoàn toàn khỏi hệ thống MongoDB. Sau khi xóa, địa chỉ Gmail <strong>{user?.email}</strong> và Username của bạn sẽ trở thành tài khoản trống và có thể dùng để đăng ký mới.
              </p>
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-4 pt-1">
                <p className="text-xs text-muted-foreground">
                  Bấm nút bên dưới để nhận mã OTP 6 chữ số về email: <strong className="text-purple-400">{user?.email}</strong>
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 h-9 rounded-xl text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSendDeleteOtp}
                    disabled={isDeleteLoading}
                    className="flex-1 h-9 rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white gap-2 font-medium"
                  >
                    {isDeleteLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Gửi OTP xóa tài khoản</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="delete-otp" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mã OTP 6 chữ số xác nhận
                  </Label>
                  <Input
                    id="delete-otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ""))}
                    className="h-10 rounded-xl bg-rose-950/20 border-rose-500/40 text-center font-bold tracking-[6px] text-sm focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={deleteTimer > 0 || isDeleteLoading}
                    onClick={handleSendDeleteOtp}
                    className={cn(
                      "flex items-center gap-1 font-medium text-[11px]",
                      deleteTimer > 0 ? "text-muted-foreground cursor-not-allowed" : "text-rose-400 hover:underline"
                    )}
                  >
                    <RotateCcw className={cn("w-3 h-3", isDeleteLoading && "animate-spin")} />
                    <span>{deleteTimer > 0 ? `Gửi lại sau (${deleteTimer}s)` : "Gửi lại OTP"}</span>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  disabled={isDeleteLoading || deleteOtp.length !== 6}
                  className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-2 mt-2"
                >
                  {isDeleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Xác nhận xóa tài khoản vĩnh viễn</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PrivacySettings;