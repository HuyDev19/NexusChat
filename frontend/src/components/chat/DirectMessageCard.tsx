import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn, isNoteExpired } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { Flame } from "lucide-react";

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages } =
    useChatStore();
  const { onlineUsers } = useSocketStore();

  if (!user) return null;

  const participants = convo.participants || [];
  const otherUser = participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;

  const displayName =
    convo.nicknames && otherUser._id in convo.nicknames && convo.nicknames[otherUser._id]
      ? convo.nicknames[otherUser._id]
      : otherUser.displayName ?? "";

  const unreadCount = convo.unreadCounts[user._id];
  const lastMessage = convo.lastMessage?.content ?? "";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
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
            status={
              !onlineUsers.includes(otherUser?._id ?? "") || otherUser?.presenceStatus === "offline"
                ? "offline"
                : otherUser?.presenceStatus === "busy"
                  ? "busy"
                  : "online"
            }
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
        convo.streak && convo.streak.count >= 1 ? (
          <div className="flex items-center gap-0.5">
            <Flame 
              className={cn(
                "size-4 transition-colors", 
                convo.streak.count >= 2 ? "text-red-500 fill-red-500" : "text-muted-foreground fill-muted-foreground"
              )} 
            />
            <span className="text-xs font-bold text-muted-foreground">{convo.streak.count}</span>
          </div>
        ) : null
      }
    />
  );
};

export default DirectMessageCard;