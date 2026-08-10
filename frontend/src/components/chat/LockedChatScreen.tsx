import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { userService } from "@/services/userService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Lock, Unlock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const LockedChatScreen = ({ conversationId }: { conversationId: string }) => {
  const { unlockConversation } = useChatStore();
  const { fetchMe } = useAuthStore();
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    try {
      const res = await userService.verifyLock(conversationId, pin);
      if (res.success) {
        unlockConversation(conversationId);
        toast.success("Đã mở khóa cuộc trò chuyện");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã PIN không chính xác");
    } finally {
      setLoading(false);
    }
  };

  const handleResetLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await userService.resetLock(conversationId, password);
      await fetchMe(); // Refresh user data to remove lock
      unlockConversation(conversationId); // also unlock it locally
      setShowResetDialog(false);
      toast.success("Đã xóa mã PIN cuộc trò chuyện");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mật khẩu không chính xác");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background flex-1 text-center px-4">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <Lock className="size-16 text-primary animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Cuộc trò chuyện đã bị khóa</h2>
      <p className="text-muted-foreground mb-8">
        Vui lòng nhập mã PIN để xem nội dung
      </p>

      <form onSubmit={handleUnlock} className="flex flex-col gap-4 w-full max-w-xs">
        <Input
          type="password"
          placeholder="Mã PIN (VD: 1234)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          className="text-center text-lg tracking-widest"
          autoFocus
        />
        <Button type="submit" className="w-full" disabled={!pin || loading}>
          {loading ? "Đang mở..." : "Mở khóa"} <Unlock className="ml-2 size-4" />
        </Button>
      </form>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogTrigger asChild>
          <Button variant="link" className="mt-4 text-muted-foreground">
            Quên mã PIN?
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetLock} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Nhập mật khẩu tài khoản của bạn để xóa mã PIN cuộc trò chuyện này.
            </p>
            <Input
              type="password"
              placeholder="Mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!password || loading}>
              Xóa mã PIN <KeyRound className="ml-2 size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LockedChatScreen;
