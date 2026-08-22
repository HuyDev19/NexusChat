import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import UnreadCountBadge from "./UnreadCountBadge";
import GroupChatAvatar from "./GroupChatAvatar";

const GroupChatCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages } =
    useChatStore();

  if (!user) return null;

  const unreadCount = convo.unreadCounts[user._id];
  const name = convo.group?.name ?? "Nhóm";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  const participants = convo.participants || [];
  const currentUser = participants.find((p) => p._id === user._id);
  const isLeader = currentUser?.role === "leader";

  return (
    <ChatCard
      convoId={convo._id}
      name={name}
      timestamp={
        convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      isGroup={true}
      isChannel={convo.type === "channel"}
      isLeader={isLeader}
      leftSection={
        <>
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
          <GroupChatAvatar
            participants={participants}
            type="chat"
            groupAvatar={convo.group?.avatar}
            groupName={convo.group?.name}
          />
        </>
      }
      subtitle={
        <p className="text-xs truncate text-muted-foreground">
          {participants.length} {convo.type === "channel" ? "người theo dõi" : "thành viên"}
        </p>
      }
    />
  );
};

export default GroupChatCard;