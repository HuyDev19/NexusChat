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

  const unreadCount = convo.unreadCounts && user._id ? (convo.unreadCounts[user._id] || 0) : 0;
  const name = convo.group?.name ?? "Nhóm";

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages(id);
    }
  };

  const participants = convo.participants || [];
  const currentUser = participants.find((p) => (p?._id || (p as any)?.userId?._id)?.toString() === user._id?.toString());
  const isLeader = currentUser?.role === "leader";

  const renderSubtitle = () => {
    if (convo.lastMessage) {
      const senderIdStr = typeof convo.lastMessage.senderId === "object"
        ? (convo.lastMessage.senderId as any)?._id || String(convo.lastMessage.senderId)
        : String(convo.lastMessage.senderId);

      const senderName = senderIdStr === user._id
        ? "Bạn"
        : senderIdStr === "000000000000000000000000"
          ? "NexusAI"
          : participants.find(p => (p?._id || (p as any)?.userId?._id)?.toString() === senderIdStr)?.displayName || "Người dùng";

      let content = "";
      if (convo.lastMessage.isRecalled) {
        content = "Đã thu hồi tin nhắn";
      } else if (convo.lastMessage.content) {
        content = convo.lastMessage.content;
      } else if (convo.lastMessage.imgUrl) {
        content = "Đã gửi một ảnh";
      } else if (convo.lastMessage.audioUrl) {
        content = "Đã gửi một tin nhắn thoại";
      } else if (convo.lastMessage.fileUrl) {
        content = "Đã gửi một tệp";
      } else if (convo.lastMessage.poll) {
        content = "Đã tạo một bình chọn";
      } else if (convo.lastMessage.sharedContact) {
        content = "Đã chia sẻ một liên hệ";
      } else {
        content = "Đã gửi một tin nhắn";
      }

      return `${senderName}: ${content}`;
    }
    return `${participants.length} ${convo.type === "channel" ? "người theo dõi" : "thành viên"}`;
  };

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
        <p className={`text-xs truncate ${unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {renderSubtitle()}
        </p>
      }
    />
  );
};

export default GroupChatCard;