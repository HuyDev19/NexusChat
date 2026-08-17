import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";
import { removeVietnameseTones } from "@/lib/utils";

const GroupChatList = () => {
  const { conversations, searchQuery, archivedConversations, pinnedConversations } = useChatStore();

  if (!conversations) return null;

  const groupchats = conversations.filter((convo) => {
    if (convo.type !== "group") return false;
    if (archivedConversations?.includes(convo._id)) return false;
    if (!searchQuery?.trim()) return true;

    const q = removeVietnameseTones(searchQuery.trim());
    if (!q) return true;

    // Tìm kiếm chuẩn xác theo Tên nhóm hoặc Tên thành viên trong nhóm
    const matchesGroupName = removeVietnameseTones(convo.group?.name || "").includes(q);
    const matchesParticipant = convo.participants?.some((p: any) => {
      const dName = removeVietnameseTones(p.displayName || p.userId?.displayName || "");
      const uName = removeVietnameseTones(p.username || p.userId?.username || "");
      return dName.includes(q) || uName.includes(q);
    });

    return matchesGroupName || matchesParticipant;
  });

  groupchats.sort((a, b) => {
    const isAPinned = pinnedConversations?.includes(a._id) ? 1 : 0;
    const isBPinned = pinnedConversations?.includes(b._id) ? 1 : 0;
    return isBPinned - isAPinned;
  });

  if (groupchats.length === 0 && searchQuery?.trim()) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        Không tìm thấy nhóm phù hợp
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {groupchats.map((convo) => (
        <GroupChatCard
          convo={convo}
          key={convo._id}
        />
      ))}
    </div>
  );
};

export default GroupChatList;