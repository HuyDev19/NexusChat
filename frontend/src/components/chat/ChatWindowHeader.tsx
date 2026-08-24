import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useCallStore } from "@/stores/useCallStore";
import { Phone, Video } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { userService } from "@/services/userService";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { Settings, Ban, Flame, Pencil, Edit3, Sparkles, Loader2, UserPlus } from "lucide-react";
import { isNoteExpired, isStreakActive, isStreakOnFire, formatLastActive, getEffectiveStatus, cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { useProfileStore } from "@/stores/useProfileStore";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers, lastActiveMap } = useSocketStore();
  const { startCall, activeCall, activeGroupCalls, joinExistingCall } = useCallStore();
  const { friends, addFriend, cancelRequest, sentList } = useFriendStore();
  const { isOpen: isProfileOpen, mode: profileMode, openChatDetails, closeProfile } = useProfileStore();
  const [isSendingRequest, setIsSendingRequest] = useState(false);

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
    const otherUsers = participants.filter(
      (p) => (p?._id || (p as any)?.userId?._id)?.toString() !== user?._id?.toString()
    );
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) {
      return (
        <header className="sticky top-0 z-10 flex flex-col w-full bg-background border-b border-border/50">
          <div className="px-4 py-2 flex items-center gap-2 w-full">
            <SidebarTrigger className="-ml-1 text-foreground shrink-0" />
            <span className="font-semibold text-sm text-foreground">Đoạn chat</span>
          </div>
        </header>
      );
    }
  }

  const isOnline = otherUser?._id ? (onlineUsers || []).includes(otherUser._id) : false;
  const effectiveStatus = getEffectiveStatus(isOnline, otherUser?.presenceStatus);
  const userLastActive = otherUser?._id ? (lastActiveMap?.[otherUser._id] || otherUser.lastActiveAt || null) : null;
  const isFriend = otherUser?._id
    ? (friends || []).some((f) => ((f as any)?._id || f)?.toString() === otherUser._id.toString())
    : true;
  const sentRequest = otherUser?._id
    ? (sentList || []).find(
        (r: any) =>
          r?.to?._id === otherUser._id ||
          r?.to === otherUser._id ||
          r?.toUser?._id === otherUser._id ||
          r?.toUser === otherUser._id
      )
    : null;
  const hasSentRequest = Boolean(sentRequest);

  const handleToggleFriendRequest = async () => {
    if (!otherUser?._id) return;
    try {
      setIsSendingRequest(true);
      if (sentRequest && sentRequest._id) {
        await cancelRequest(sentRequest._id);
        toast.success("Đã hủy lời mời kết bạn");
      } else {
        await addFriend(otherUser._id, "Xin chào, mình muốn kết bạn!");
        toast.success("Đã gửi lời mời kết bạn thành công");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi thao tác lời mời kết bạn");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleStartCall = (isVideo: boolean) => {
    if (chat?._id) {
      startCall(chat._id, isVideo);
    }
  };

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (!chat?._id) return;
    setShowSummaryModal(true);
    setIsSummarizing(true);
    setSummaryText("");
    try {
      const data = await chatService.summarizeChat(chat._id);
      setSummaryText(data.summary);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tóm tắt đoạn chat");
      setShowSummaryModal(false);
    } finally {
      setIsSummarizing(false);
    }
  };

  const getDisplayName = (userObj: any) => {
    if (!userObj) return "Unknown";
    return chat?.nicknames?.[userObj._id] || userObj.displayName;
  };

  return (
    <header className="sticky top-0 z-10 flex flex-col w-full bg-background border-b border-border/50">
      <div className="px-4 py-2 flex items-center gap-2 w-full justify-between overflow-hidden">
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
                    if (isProfileOpen && profileMode === "chat") {
                      closeProfile();
                    } else {
                      openChatDetails(otherUser?._id);
                    }
                  }}
                >
                  <UserAvatar
                    type={"sidebar"}
                    name={chat?.nicknames?.[otherUser?._id ?? ""] || otherUser?.displayName || ""}
                    avatarUrl={otherUser?.avatarUrl ?? undefined}
                    note={isNoteExpired(typeof otherUser?.note === 'string' ? null : otherUser?.note) ? undefined : (typeof otherUser?.note === "string" ? otherUser.note : otherUser?.note?.content)}
                    userId={otherUser?._id}
                  />
                  <StatusBadge
                    status={effectiveStatus}
                    lastActiveAt={userLastActive}
                  />
                </div>
              ) : (
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (isProfileOpen && profileMode === "chat") {
                      closeProfile();
                    } else {
                      openChatDetails(undefined);
                    }
                  }}
                >
                  <GroupChatAvatar
                    participants={chat?.participants || []}
                    type="sidebar"
                    groupAvatar={chat?.group?.avatar}
                    groupName={chat?.group?.name}
                  />
                </div>
              )}
            </div>

            {/* name & badge & unfriend/online status (2 vertical rows) */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2
                  className="font-semibold text-foreground truncate max-w-[220px] leading-snug cursor-pointer hover:underline"
                  onClick={() => {
                    if (isProfileOpen && profileMode === "chat") {
                      closeProfile();
                    } else {
                      openChatDetails(chat?.type === "direct" ? otherUser?._id : undefined);
                    }
                  }}
                >
                  {chat?.type === "direct"
                    ? getDisplayName(otherUser)
                    : chat?.group?.name || "Nhóm"}
                </h2>

                {chat?.type === "direct" && otherUser && !isFriend && (
                  <span className="bg-zinc-700/80 text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase shrink-0">
                    NGƯỜI LẠ
                  </span>
                )}

                {chat?.type === "direct" && isStreakActive(chat?.streak) && chat?.streak && chat.streak.count >= 1 && (
                  <div className="flex items-center gap-0.5" title={isStreakOnFire(chat.streak) ? `${chat.streak.count} ngày liên tiếp - Cả 2 đã thắp sáng chuỗi hôm nay!` : `${chat.streak.count} ngày liên tiếp - Đang chờ người kia nhắn lại`}>
                    <Flame
                      className={cn(
                        "size-4 transition-colors",
                        isStreakOnFire(chat.streak) ? "text-amber-500 fill-amber-500" : "text-zinc-800 dark:text-zinc-400 fill-zinc-800 dark:fill-zinc-400"
                      )}
                    />
                    <span className={cn("text-xs font-bold", isStreakOnFire(chat.streak) ? "text-amber-500" : "text-zinc-500")}>
                      {chat.streak.count}
                    </span>
                  </div>
                )}
              </div>

              {chat?.type === "direct" && otherUser ? (
                !isFriend ? (
                  <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400 leading-tight">
                    Chưa kết bạn với người này
                  </span>
                ) : (
                  <span className={cn("text-[11px] font-medium leading-tight",
                    effectiveStatus === "online" ? "text-emerald-500" :
                    effectiveStatus === "busy" ? "text-red-500 font-semibold" :
                    "text-muted-foreground"
                  )}>
                    {formatLastActive(userLastActive, isOnline, otherUser?.presenceStatus)}
                  </span>
                )
              ) : chat?.type === "group" ? (
                <span className="text-[11px] font-medium text-muted-foreground leading-tight">
                  {chat?.participants?.length || 0} thành viên
                </span>
              ) : chat?.type === "channel" ? (
                <span className="text-[11px] font-medium text-muted-foreground leading-tight">
                  {chat?.participants?.length || 0} người theo dõi
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Call Actions */}
        {!activeCall && (
          chat?.type !== 'direct' && chat?._id && activeGroupCalls?.[chat._id] ? (
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
              <button
                onClick={handleSummarize}
                className="p-2 rounded-full hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 transition-colors duration-200"
                title="Tóm tắt đoạn chat bằng AI"
              >
                <Sparkles size={20} />
              </button>
              {chat?.type === "channel" ? (
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/chat?join=${chat._id}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Đã sao chép liên kết kênh!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-medium text-xs flex items-center gap-1.5 transition-colors border border-orange-500/20"
                  title="Sao chép liên kết mời"
                >
                  <span className="hidden sm:inline">Copy Link</span>
                  <span className="sm:hidden">Link</span>
                </button>
              ) : (
                <>
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
                </>
              )}
            </div>
          )
        )}
      </div>

      {/* Stranger Friend Request Banner matching exact screenshot */}
      {chat?.type === "direct" && otherUser && !isFriend && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <UserPlus className="size-4 text-muted-foreground" />
            <span>Gửi yêu cầu kết bạn tới người này</span>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isSendingRequest}
            onClick={handleToggleFriendRequest}
            className={cn(
              "h-8 px-4 text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer",
              hasSentRequest
                ? "bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 border-none"
            )}
          >
            {isSendingRequest ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : hasSentRequest ? (
              "Hủy lời mời"
            ) : (
              "Gửi kết bạn"
            )}
          </Button>
        </div>
      )}

      {/* Dialog Tóm tắt đoạn chat */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-xl p-6 rounded-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-border/40 pb-3 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-purple-400">
              <Sparkles className="w-5 h-5" />
              <span>Tóm tắt cuộc trò chuyện</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pt-4 pb-2 pr-2 beautiful-scrollbar">
            {isSummarizing ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                <p className="text-sm font-medium">NexusAI đang đọc tin nhắn và tóm tắt...</p>
              </div>
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {summaryText}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-border/40 shrink-0">
            <Button
              type="button"
              onClick={() => setShowSummaryModal(false)}
              className="h-9 rounded-xl text-xs bg-muted hover:bg-muted/80 text-foreground"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default ChatWindowHeader;