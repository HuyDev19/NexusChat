import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useChatStore } from "@/stores/useChatStore";
import { useUserStore } from "@/stores/useUserStore";
import { useProfileStore } from "@/stores/useProfileStore";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, Sparkles, Trash2, Smile, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, isNoteExpired, getEffectiveStatus } from "@/lib/utils";

const StoryBar = () => {
  const { user } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const { onlineUsers, lastActiveMap } = useSocketStore();
  const { conversations, setActiveConversation, createConversation } = useChatStore();
  const { updateNote } = useUserStore();
  const { openProfile } = useProfileStore();

  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [expiresIn, setExpiresIn] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const activeUserNote = isNoteExpired(user?.note) ? null : user?.note?.content;

  const handleOpenMyNote = () => {
    setNoteInput(activeUserNote || "");
    setOpenNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) {
      toast.error("Vui lòng nhập nội dung ghi chú!");
      return;
    }
    try {
      setIsSubmitting(true);
      await updateNote(noteInput.trim(), expiresIn);
      setOpenNoteModal(false);
      toast.success("Đã cập nhật trạng thái ghi chú!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật ghi chú");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setIsSubmitting(true);
      await updateNote("", 0);
      setNoteInput("");
      setOpenNoteModal(false);
      toast.success("Đã xóa trạng thái ghi chú!");
    } catch (error) {
      toast.error("Lỗi khi xóa ghi chú");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectFriend = async (friendId: string) => {
    // Mở Profile thông tin của bạn bè
    await openProfile(friendId);

    // Mở đồng thời đoạn chat nếu đã có
    const directConvo = conversations.find(
      (c) => c.type === "direct" && c.participants?.some((p) => p._id === friendId)
    );
    
    if (directConvo) {
      setActiveConversation(directConvo._id);
    } else {
      // Nếu chưa có, tạo cuộc trò chuyện mới để bắt đầu chat
      await createConversation("direct", "", [friendId]);
    }
  };

  // Danh sách hiển thị bạn bè trên Story/Note Bar:
  // Kết hợp danh sách bạn bè và người trò chuyện trực tiếp
  const allStoryUsersMap = new Map<string, any>();

  (friends || []).forEach((f) => {
    if (f && f._id && f._id !== user?.id && f._id !== user?._id) {
      allStoryUsersMap.set(f._id, f);
    }
  });

  (conversations || [])
    .filter((c) => c.type === "direct")
    .forEach((c) => {
      const otherUser = c.participants?.find((p) => p._id !== user?._id);
      if (otherUser && otherUser._id && !allStoryUsersMap.has(otherUser._id)) {
        allStoryUsersMap.set(otherUser._id, otherUser);
      }
    });

  const allStoryUsers = Array.from(allStoryUsersMap.values());

  // Sắp xếp thứ tự ưu tiên:
  // 1. Bạn bè có Ghi chú trạng thái (Cloud Note) còn hạn lên đầu
  // 2. Bạn bè đang Online
  // 3. Các bạn bè khác (kèm trạng thái offline/thời gian hoạt động gần nhất)
  const sortedFriends = allStoryUsers.sort((a, b) => {
    const hasNoteA = !isNoteExpired(a.note) ? 1 : 0;
    const hasNoteB = !isNoteExpired(b.note) ? 1 : 0;
    if (hasNoteB !== hasNoteA) return hasNoteB - hasNoteA;

    const isOnlineA = (onlineUsers || []).includes(a._id) && a.presenceStatus !== 'offline' ? 1 : 0;
    const isOnlineB = (onlineUsers || []).includes(b._id) && b.presenceStatus !== 'offline' ? 1 : 0;
    if (isOnlineB !== isOnlineA) return isOnlineB - isOnlineA;

    return (a.displayName || "").localeCompare(b.displayName || "");
  });

  if (!user) return null;

  return (
    <>
      <div className="w-full px-2 py-1.5 overflow-hidden">
        <div
          className="flex items-start gap-3.5 overflow-x-auto beautiful-scrollbar pb-1.5 pt-1 px-1 scroll-smooth"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          {/* ========================================================= */}
          {/* 1. Tin của bạn (Current User)                             */}
          {/* ========================================================= */}
          <div
            onClick={handleOpenMyNote}
            className="flex flex-col items-center shrink-0 cursor-pointer group w-[64px]"
          >
            {/* Speech Bubble on top */}
            <div className="h-[28px] flex items-center justify-center mb-1 relative">
              {activeUserNote ? (
                <div className="relative max-w-[70px] bg-card text-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md border border-purple-500/30 truncate text-center animate-in fade-in zoom-in-95 duration-200">
                  <span className="truncate block max-w-[54px]">{activeUserNote}</span>
                  {/* Bubble Tail */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-card border-r border-b border-purple-500/30 rotate-45" />
                </div>
              ) : (
                <div className="relative bg-muted/80 text-muted-foreground text-[9px] px-1.5 py-0.5 rounded-full border border-border/40 shadow-xs text-center group-hover:text-purple-400 group-hover:border-purple-500/40 transition-colors">
                  <span>Nghĩ gì?</span>
                  {/* Bubble Tail */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-muted/80 border-r border-b border-border/40 rotate-45" />
                </div>
              )}
            </div>

            {/* Avatar with Plus Badge */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-600 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-primary/30 group-hover:-translate-y-[2px] transition-all duration-300 shadow-sm shadow-purple-500/20">
                <div className="w-full h-full rounded-full overflow-hidden bg-background">
                  <UserAvatar
                    type="sidebar"
                    name={user.displayName}
                    avatarUrl={user.avatarUrl}
                    userId={user._id}
                  />
                </div>
              </div>

              {/* Plus Badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center border-2 border-background shadow-xs">
                <Plus className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Label */}
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground mt-1.5 text-center truncate max-w-[62px]">
              Tin của bạn
            </span>
          </div>

          {/* ========================================================= */}
          {/* 2. Danh sách Bạn bè & Trạng thái Note                     */}
          {/* ========================================================= */}
          {sortedFriends.map((friend) => {
            if (!friend || !friend._id) return null;
            const hasNote = !isNoteExpired(friend.note);
            const isOnline = (onlineUsers || []).includes(friend._id);
            const effectiveStatus = getEffectiveStatus(isOnline, friend.presenceStatus);
            const shortName = (friend.displayName || "User").split(" ").pop() || friend.displayName || "User";

            return (
              <div
                key={friend._id}
                onClick={() => handleSelectFriend(friend._id)}
                className="flex flex-col items-center shrink-0 cursor-pointer group w-[64px]"
              >
                {/* Speech Bubble on top */}
                <div className="h-[28px] flex items-center justify-center mb-1 relative">
                  {hasNote && friend.note ? (
                    <div className="relative max-w-[70px] bg-card text-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-md border border-purple-500/30 truncate text-center animate-in fade-in zoom-in-95 duration-200">
                      <span className="truncate block max-w-[54px]">{friend.note.content}</span>
                      {/* Bubble Tail */}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-card border-r border-b border-purple-500/30 rotate-45" />
                    </div>
                  ) : null}
                </div>

                {/* Avatar with Online Dot */}
                <div className="relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full p-0.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-primary/30 group-hover:-translate-y-[2px]",
                      hasNote
                        ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-sm shadow-purple-500/20"
                        : "bg-border/60"
                    )}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-background">
                      <UserAvatar
                        type="sidebar"
                        name={friend.displayName}
                        avatarUrl={friend.avatarUrl}
                        userId={friend._id}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <StatusBadge
                    status={effectiveStatus}
                    lastActiveAt={lastActiveMap?.[friend._id] || friend.lastActiveAt}
                    showMinutesBadge={true}
                  />
                </div>

                {/* Friend Name */}
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground mt-1.5 text-center truncate max-w-[62px]">
                  {shortName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* Modal Chia sẻ Trạng thái Ghi chú (Cloud Note 24h)          */}
      {/* ========================================================= */}
      <Dialog open={openNoteModal} onOpenChange={setOpenNoteModal}>
        <DialogContent className="sm:max-w-[380px] rounded-3xl p-6 glass-strong border-border/40">
          <DialogHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold">
              Ghi chú trạng thái
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Chia sẻ suy nghĩ ngắn của bạn. Ghi chú sẽ tự động gỡ sau khoảng thời gian bạn chọn.
            </p>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Bạn đang nghĩ gì thế?..."
                value={noteInput}
                maxLength={60}
                onChange={(e) => setNoteInput(e.target.value)}
                className="pr-12 h-10 rounded-2xl bg-muted/40 border-border/60 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {noteInput.length}/60
              </div>
            </div>

            {/* Quick emoji suggestions */}
            <div className="flex items-center justify-center gap-2 pt-1 text-base">
              {["☕", "🎧", "🚀", "💤", "🎉", "🔥", "✨", "📚"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNoteInput((prev) => (prev ? `${prev} ${emoji}` : emoji).slice(0, 60))}
                  className="hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tự động gỡ sau</label>
              <div className="flex gap-2">
                {[6, 12, 24].map(hours => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setExpiresIn(hours)}
                    className={cn(
                      "flex-1 py-1.5 text-xs rounded-lg border transition-colors",
                      expiresIn === hours 
                        ? "bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400 font-medium" 
                        : "bg-muted/30 border-border hover:bg-muted/60"
                    )}
                  >
                    {hours} giờ
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2 pt-2">
            {activeUserNote && (
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleDeleteNote}
                className="flex-1 h-9 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-border/40 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Gỡ ghi chú</span>
              </Button>
            )}
            <Button
              type="button"
              disabled={isSubmitting || !noteInput.trim()}
              onClick={handleSaveNote}
              className="flex-1 h-9 rounded-xl text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-purple-500/20 gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Smile className="w-3.5 h-3.5" />
                  <span>Chia sẻ</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoryBar;
