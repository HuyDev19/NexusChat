import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";

const CommunityChatList = () => {
  const { conversations, searchQuery, archivedConversations } = useChatStore();

  if (!conversations) return null;

  const communities = conversations.filter((convo) => {
    if (convo.type !== "community") return false;
    if (archivedConversations?.includes(convo._id)) return false;
    if (!searchQuery?.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    const matchesName = convo.group?.name?.toLowerCase().includes(q) || "cộng đồng nexuschat".includes(q);
    const matchesLastMsg = convo.lastMessage?.content?.toLowerCase().includes(q);

    return matchesName || matchesLastMsg;
  });

  if (communities.length === 0 && searchQuery?.trim()) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        Không tìm thấy cộng đồng phù hợp
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {communities.map((convo) => (
        <GroupChatCard convo={convo} key={convo._id} />
      ))}
    </div>
  );
};

export default CommunityChatList;
