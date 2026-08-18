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
import { Settings, Ban, Flame, Pencil, Edit3 } from "lucide-react";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { startCall, activeCall, activeGroupCalls, joinExistingCall } = useCallStore();

  let otherUser: any = null;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const participants = chat.participants || [];
    const otherUsers = participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return null;
  }

  const handleStartCall = (isVideo: boolean) => {
    if (chat?._id) {
      startCall(chat._id, isVideo);
    }
  };

  const [showLockDialog, setShowLockDialog] = useState(false);
  const [newPin, setNewPin] = useState("");
  const { fetchMe } = useAuthStore();
  const { unlockConversation, updateGroupInfo } = useChatStore();

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameVal, setRenameVal] = useState(chat?.group?.name || "");

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameVal.trim()) {
      toast.warning("Vui lòng nhập tên mới!");
      return;
    }
    if (chat?._id) {
      try {
        await updateGroupInfo(chat._id, renameVal.trim());
        toast.success("Đổi tên thành công!");
        setShowRenameModal(false);
      } catch (error) {
        toast.error("Không thể đổi tên");
      }
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
      <div className="flex items-center gap-2 w-full justify-between overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 text-foreground shrink-0" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4 shrink-0"
          />

          <div className="p-2 flex items-center gap-3 min-w-0">
            {/* avatar */}
            <div className="relative shrink-0">
              {chat.type === "direct" ? (
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    import("@/stores/useProfileStore").then((mod) => {
                      const state = mod.useProfileStore.getState();
                      if (state.isOpen && state.mode === "chat") {
                        state.closeProfile();
                      } else {
                        state.openChatDetails(chat?.type === "direct" ? otherUser?._id : undefined);
                      }
                    });
                  }}
                >
                  <UserAvatar
                    type={"sidebar"}
                    name={chat?.nicknames?.[otherUser?._id ?? ""] || otherUser?.displayName || ""}
                    avatarUrl={otherUser?.avatarUrl ?? undefined}
                    note={typeof otherUser?.note === "string" ? otherUser.note : otherUser?.note?.content}
                    userId={otherUser?._id}
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
                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    import("@/stores/useProfileStore").then((mod) => {
                      const state = mod.useProfileStore.getState();
                      if (state.isOpen && state.mode === "chat") {
                        state.closeProfile();
                      } else {
                        state.openChatDetails(chat?.type === "direct" ? otherUser?._id : undefined);
                      }
                    });
                  }}
                >
                  <GroupChatAvatar
                    participants={chat.participants || []}
                    type="sidebar"
                    groupAvatar={chat.group?.avatar}
                    groupName={chat.group?.name}
                  />
                </div>
              )}
            </div>

            {/* name & streak */}
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-foreground truncate max-w-[220px]">
                {chat.type === "direct"
                  ? getDisplayName(otherUser)
                  : chat.group?.name || "Nhóm"}
              </h2>

              {chat.type === "group" && (
                <button
                  type="button"
                  onClick={() => {
                    setRenameVal(chat.group?.name || "");
                    setShowRenameModal(true);
                  }}
                  title="Đổi tên nhóm chat"
                  className="p-1 rounded-lg text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              {chat.type === "direct" && chat.streak && chat.streak.count >= 1 && (
                <div className="flex items-center gap-0.5" title={`${chat.streak.count} ngày liên tiếp`}>
                  <Flame 
                    className={cn(
                      "size-5 transition-colors", 
                      chat.streak.count >= 2 ? "text-red-500 fill-red-500" : "text-muted-foreground fill-muted-foreground"
                    )} 
                  />
                  <span className="text-sm font-bold text-muted-foreground">{chat.streak.count}</span>
                </div>
              )}
            </div>
            </div>
          </div>

        {/* Call Actions */}
        {!activeCall && (
          chat?.type !== 'direct' && chat?._id && activeGroupCalls[chat._id] ? (
            <div className="pr-2 shrink-0">
              <button
                onClick={() => joinExistingCall(chat._id, activeGroupCalls[chat._id].roomName, activeGroupCalls[chat._id].isVideo)}
                className="px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white font-medium text-sm flex items-center gap-1.5 transition-colors shadow-md animate-pulse"
              >
                {activeGroupCalls[chat._id].isVideo ? <Video size={16} /> : <Phone size={16} />}
                Tham gia
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 pr-2 shrink-0">
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
            </div>
          )
        )}
      </div>

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

      {/* Dialog đổi tên Nhóm / Cộng đồng */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Edit3 className="w-5 h-5 text-purple-400" />
              <span>Đổi tên Nhóm chat</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tên mới cho nhóm chat
              </Label>
              <Input
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                placeholder="Nhập tên mới..."
                className="h-10 rounded-xl bg-muted/40 text-xs focus:border-purple-500"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRenameModal(false)}
                className="h-9 rounded-xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-purple-500/20"
              >
                Lưu tên mới
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default ChatWindowHeader;