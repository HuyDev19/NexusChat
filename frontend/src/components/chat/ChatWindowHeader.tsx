import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { useCallStore } from "@/stores/useCallStore";
import { Phone, Video, Lock as LockIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { Settings, Image as ImageIcon, CaseSensitive, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WallpaperModal from "./WallpaperModal";
import NicknameModal from "./NicknameModal";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { startCall, activeCall } = useCallStore();

  let otherUser;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return null;
  }

  const handleStartCall = (isVideo: boolean) => {
    if (chat?._id) {
      startCall(chat._id, isVideo);
    }
  };

  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newPin, setNewPin] = useState("");
  const { fetchMe, blockUser, unblockUser } = useAuthStore();
  const { unlockConversation } = useChatStore();

  const isBlocked = user?.blockedUsers?.includes(otherUser?._id);

  const handleBlockUser = async () => {
    if (!otherUser) return;
    if (isBlocked) {
      await unblockUser(otherUser._id);
    } else {
      await blockUser(otherUser._id);
    }
  };

  const getDisplayName = (userObj: any) => {
    if (!userObj) return "Unknown";
    return chat?.nicknames?.[userObj._id] || userObj.displayName;
  };

  const handleSetLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      toast.error("Mã PIN phải có 4 ký tự");
      return;
    }
    if (chat?._id) {
      try {
        await userService.lockConversation(chat._id, newPin);
        await fetchMe();
        unlockConversation(chat._id); // So they don't get locked out immediately
        toast.success("Đã khóa cuộc trò chuyện");
        setShowLockDialog(false);
        setNewPin("");
      } catch (error) {
        toast.error("Lỗi khi khóa cuộc trò chuyện");
      }
    }
  };

  const isLocked = user?.lockedConversations?.some(l => l.conversationId === chat?._id);

  return (
    <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background border-b border-border/50">
      <div className="flex items-center gap-2 w-full justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="p-2 flex items-center gap-3">
            {/* avatar */}
            <div className="relative">
              {chat.type === "direct" ? (
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    import("@/stores/useProfileStore").then((mod) => {
                      mod.useProfileStore.getState().openProfile(otherUser?._id ?? "");
                    });
                  }}
                >
                  <UserAvatar
                    type={"sidebar"}
                    name={getDisplayName(otherUser)}
                    avatarUrl={otherUser?.avatarUrl || undefined}
                  />
                  <StatusBadge
                    status={
                      !onlineUsers.includes(otherUser?._id ?? "") || otherUser?.presenceStatus === "offline"
                        ? "offline"
                        : otherUser?.presenceStatus === "busy"
                          ? "busy"
                          : "online"
                    }
                  />
                </div>
              ) : (
                <GroupChatAvatar
                  participants={chat.participants}
                  type="sidebar"
                />
              )}
            </div>

            {/* name */}
            <h2 className="font-semibold text-foreground">
              {chat.type === "direct" ? getDisplayName(otherUser) : chat.group?.name}
            </h2>
          </div>
        </div>

        {/* Call Actions */}
        {!activeCall && (
          <div className="flex items-center gap-2 pr-2">
            {!isLocked && (
              <button
                onClick={() => setShowLockDialog(true)}
                className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-200"
                title="Khóa cuộc trò chuyện"
              >
                <LockIcon size={20} />
              </button>
            )}
            <button
              onClick={() => handleStartCall(false)}
              className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-200"
              title="Bắt đầu cuộc gọi thoại"
            >
              <Phone size={20} />
            </button>
            <button
              onClick={() => handleStartCall(true)}
              className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-200"
              title="Bắt đầu cuộc gọi video"
            >
              <Video size={20} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors duration-200"
                  title="Tùy chỉnh"
                >
                  <Settings size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowWallpaperModal(true)} className="cursor-pointer gap-2">
                  <ImageIcon className="size-4" />
                  Đổi hình nền
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNicknameModal(true)} className="cursor-pointer gap-2">
                  <CaseSensitive className="size-4" />
                  Đổi biệt danh
                </DropdownMenuItem>
                {chat.type === "direct" && (
                  <DropdownMenuItem onClick={handleBlockUser} className={isBlocked ? "cursor-pointer gap-2 text-green-500 hover:text-green-600 focus:text-green-600 focus:bg-green-50" : "cursor-pointer gap-2 text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50"}>
                    <Ban className="size-4" />
                    {isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {chat && (
        <>
          <WallpaperModal open={showWallpaperModal} onOpenChange={setShowWallpaperModal} conversationId={chat._id} />
          <NicknameModal open={showNicknameModal} onOpenChange={setShowNicknameModal} conversation={chat} />
        </>
      )}

      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khóa cuộc trò chuyện</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetLock} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Nhập mã PIN 4 số để khóa cuộc trò chuyện này. Bạn sẽ cần mã PIN này mỗi khi mở lại cuộc trò chuyện.
            </p>
            <Input
              type="password"
              placeholder="Nhập mã PIN mới (VD: 1234)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              maxLength={4}
              className="text-center tracking-widest text-lg"
            />
            <Button type="submit" className="w-full" disabled={newPin.length !== 4}>
              Xác nhận khóa <LockIcon className="ml-2 size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default ChatWindowHeader;