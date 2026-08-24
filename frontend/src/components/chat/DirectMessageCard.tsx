import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn, isNoteExpired, isStreakActive, isStreakOnFire, getEffectiveStatus } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { Flame } from "lucide-react";

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages } =
    useChatStore();
  const { onlineUsers, lastActiveMap } = useSocketStore();

  if (!user) return null;

  const participants = convo.participants || [];
  const otherUser = participants.find((p) => (p?._id || (p as any)?.userId?._id)?.toString() !== user._id?.toString());
  if (!otherUser) return null;

  const otherUserId = (otherUser._id || (otherUser as any)?.userId?._id)?.toString() || "";

  const displayName =
    convo.nicknames && otherUserId && otherUserId in convo.nicknames && convo.nicknames[otherUserId]
      ? convo.nicknames[otherUserId]
      : otherUser.displayName ?? "";

  const unreadCount = convo.unreadCounts && user._id ? (convo.unreadCounts[user._id] || 0) : 0;
  const lastMessage = convo.lastMessage?.content ?? "";

  const isOnline = otherUserId ? (onlineUsers || []).includes(otherUserId) : false;
  const effectiveStatus = getEffectiveStatus(isOnline, otherUser?.presenceStatus);
  const userLastActive = otherUserId ? (lastActiveMap?.[otherUserId] || otherUser.lastActiveAt || null) : null;

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages(id);
    }
  };

  return (
    <ChatCard
      convoId={convo._id}
      name={displayName}
      targetUser={{
        _id: otherUser._id,
        displayName: displayName,
        username: otherUser.username || "",
        avatarUrl: otherUser.avatarUrl || undefined,
      }}
      timestamp={
        convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      leftSection={
        <>
          <UserAvatar
            type="sidebar"
            name={displayName}
            avatarUrl={otherUser.avatarUrl ?? undefined}
            note={isNoteExpired(otherUser.note) ? undefined : otherUser.note?.content}
            userId={otherUser._id}
          />
          <StatusBadge
            status={effectiveStatus}
            lastActiveAt={userLastActive}
            showMinutesBadge={true}
          />
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
        </>
      }
      subtitle={
        <p
          className={cn(
            "text-sm truncate",
            unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {lastMessage}
        </p>
      }
      rightSection={
        isStreakActive(convo.streak) && convo.streak && convo.streak.count >= 1 ? (
          <div className="flex items-center gap-0.5" title={isStreakOnFire(convo.streak) ? "Cả 2 đã cùng giữ chuỗi hôm nay!" : "Đang chờ người kia nhắn lại để thắp sáng chuỗi"}>
            <Flame 
              className={cn(
                "size-4 transition-colors", 
                isStreakOnFire(convo.streak) ? "text-amber-500 fill-amber-500" : "text-zinc-800 dark:text-zinc-400 fill-zinc-800 dark:fill-zinc-400"
              )} 
            />
            <span className={cn("text-xs font-bold", isStreakOnFire(convo.streak) ? "text-amber-500" : "text-zinc-500")}>
              {convo.streak.count}
            </span>
          </div>
        ) : null
      }
    />
  );
};

export default DirectMessageCard;