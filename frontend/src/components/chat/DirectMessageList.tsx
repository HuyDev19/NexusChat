import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import DirectMessageCard from "./DirectMessageCard";
import { removeVietnameseTones } from "@/lib/utils";

const DirectMessageList = () => {
  const { conversations, searchQuery, archivedConversations, pinnedConversations } = useChatStore();
  const { user } = useAuthStore();

  if (!conversations || !user) return null;

  const directConversations = conversations.filter((convo) => {
    if (convo.type !== "direct") return false;
    if (archivedConversations?.includes(convo._id)) return false;
    if (!searchQuery?.trim()) return true;

    const q = removeVietnameseTones(searchQuery.trim());
    if (!q) return true;

    const participants = convo.participants || [];
    const otherUser = participants.find((p) => p._id !== user._id);
    if (!otherUser) return false;

    const otherUserId = otherUser._id;
    const dName = removeVietnameseTones(otherUser.displayName || "");
    const uName = removeVietnameseTones(otherUser.username || "");
    const nickName = (convo.nicknames && otherUserId in convo.nicknames)
      ? removeVietnameseTones(convo.nicknames[otherUserId] || "")
      : "";

    return dName.includes(q) || uName.includes(q) || nickName.includes(q);
  });

  directConversations.sort((a, b) => {
    const isAPinned = pinnedConversations?.includes(a._id) ? 1 : 0;
    const isBPinned = pinnedConversations?.includes(b._id) ? 1 : 0;
    return isBPinned - isAPinned;
  });

  if (directConversations.length === 0 && searchQuery?.trim()) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        Không tìm thấy bạn bè phù hợp
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {directConversations.map((convo) => (
        <DirectMessageCard convo={convo} key={convo._id} />
      ))}
    </div>
  );
};

export default DirectMessageList;