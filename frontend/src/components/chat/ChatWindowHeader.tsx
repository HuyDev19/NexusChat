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
import { Settings, Ban, Flame, Pencil, Edit3, Sparkles, Loader2 } from "lucide-react";
import { chatService } from "@/services/chatService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isNoteExpired } from "@/lib/utils";
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
                    note={isNoteExpired(typeof otherUser?.note === 'string' ? null : otherUser?.note) ? undefined : (typeof otherUser?.note === "string" ? otherUser.note : otherUser?.note?.content)}
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
              <button
                onClick={handleSummarize}
                className="p-2 rounded-full hover:bg-purple-500/10 text-purple-400 hover:text-purple-300 transition-colors duration-200"
                title="Tóm tắt đoạn chat bằng AI"
              >
                <Sparkles size={20} />
              </button>
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
              <div className="text-sm leading-relaxed whitespace-pre-wrap markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({ node, children, ...props }) => <ul className="list-disc pl-4 mb-2" {...props}>{children}</ul>,
                    ol: ({ node, children, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props}>{children}</ol>,
                    li: ({ node, children, ...props }) => <li className="mb-1" {...props}>{children}</li>,
                    p: ({ node, children, ...props }) => <p className="mb-2 last:mb-0" {...props}>{children}</p>,
                  }}
                >
                  {summaryText}
                </ReactMarkdown>
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