import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import ChatCard from "./ChatCard";
import UnreadCountBadge from "./UnreadCountBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { Globe } from "lucide-react";

const GroupChatCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages } =
    useChatStore();

  if (!user) return null;

  const isCommunity = convo.type === "community";
  const unreadCount = convo.unreadCounts[user._id];
  const name = convo.group?.name ?? (isCommunity ? "Cộng đồng NexusChat 🌐" : "Nhóm");

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
      isLeader={isLeader}
      leftSection={
        isCommunity ? (
          <div className="relative">
            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <>
            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
            <GroupChatAvatar
              participants={participants}
              type="chat"
              groupAvatar={convo.group?.avatar}
              groupName={convo.group?.name}
            />
          </>
        )
      }
      subtitle={
        isCommunity ? (
          <p className="text-xs truncate text-blue-400 font-medium">
            Cộng đồng chung • Rất đông thành viên
          </p>
        ) : (
          <p className="text-xs truncate text-muted-foreground">
            {participants.length} thành viên
          </p>
        )
      }
    />
  );
};

export default GroupChatCard;