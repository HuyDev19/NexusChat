import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import DirectMessageCard from "./DirectMessageCard";
import GroupChatCard from "./GroupChatCard";
import { removeVietnameseTones, cn } from "@/lib/utils";
import { MessageSquare, Users, UserCheck } from "lucide-react";

type FilterTab = "all" | "direct" | "group";

const ConversationList = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { conversations, searchQuery, archivedConversations, pinnedConversations } = useChatStore();
  const { user } = useAuthStore();

  if (!conversations || !user) return null;

  // Lọc theo Tab và Search
  const filteredConversations = conversations.filter((convo) => {
    // Ẩn hội thoại lưu trữ
    if (archivedConversations?.includes(convo._id)) return false;

    // Lọc theo Tab (All, Bạn bè, Nhóm)
    if (activeTab === "direct" && convo.type !== "direct") return false;
    if (activeTab === "group" && convo.type !== "group") return false;

    // Lọc theo Từ khóa tìm kiếm
    if (!searchQuery?.trim()) return true;

    const q = removeVietnameseTones(searchQuery.trim());
    if (!q) return true;

    if (convo.type === "direct") {
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
    }

    if (convo.type === "group") {
      const matchesGroupName = removeVietnameseTones(convo.group?.name || "").includes(q);
      const matchesParticipant = convo.participants?.some((p: any) => {
        const dName = removeVietnameseTones(p.displayName || p.userId?.displayName || "");
        const uName = removeVietnameseTones(p.username || p.userId?.username || "");
        return dName.includes(q) || uName.includes(q);
      });
      return matchesGroupName || matchesParticipant;
    }

    return true;
  });

  // Sắp xếp: Ghim lên đầu, sau đó theo tin nhắn mới nhất
  filteredConversations.sort((a, b) => {
    const isAPinned = pinnedConversations?.includes(a._id) ? 1 : 0;
    const isBPinned = pinnedConversations?.includes(b._id) ? 1 : 0;
    if (isAPinned !== isBPinned) {
      return isBPinned - isAPinned;
    }

    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.lastMessageAt || 0).getTime();
    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.lastMessageAt || 0).getTime();
    return timeB - timeA;
  });

  // Đếm số lượng tin nhắn chưa đọc cho từng tab
  const getUnreadCount = (type?: "direct" | "group") => {
    return conversations.reduce((total, convo) => {
      if (archivedConversations?.includes(convo._id)) return total;
      if (type && convo.type !== type) return total;
      const count = convo.unreadCounts?.[user._id] || 0;
      return total + count;
    }, 0);
  };

  const totalUnreadAll = getUnreadCount();
  const totalUnreadDirect = getUnreadCount("direct");
  const totalUnreadGroup = getUnreadCount("group");

  return (
    <div className="flex flex-col h-full">
      {/* 3 Nút chuyển đổi Tab: All, Bạn bè, Nhóm */}
      <div className="px-2 py-1.5 mb-1">
        <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/40">
          {/* 1. Tab Tất cả (All) */}
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200",
              activeTab === "all"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tất cả</span>
            {totalUnreadAll > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center",
                activeTab === "all" ? "bg-white text-purple-700" : "bg-purple-600 text-white"
              )}>
                {totalUnreadAll > 99 ? "99+" : totalUnreadAll}
              </span>
            )}
          </button>

          {/* 2. Tab Bạn bè */}
          <button
            type="button"
            onClick={() => setActiveTab("direct")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200",
              activeTab === "direct"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Bạn bè</span>
            {totalUnreadDirect > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center",
                activeTab === "direct" ? "bg-white text-purple-700" : "bg-purple-600 text-white"
              )}>
                {totalUnreadDirect > 99 ? "99+" : totalUnreadDirect}
              </span>
            )}
          </button>

          {/* 3. Tab Nhóm */}
          <button
            type="button"
            onClick={() => setActiveTab("group")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200",
              activeTab === "group"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nhóm</span>
            {totalUnreadGroup > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center",
                activeTab === "group" ? "bg-white text-purple-700" : "bg-purple-600 text-white"
              )}>
                {totalUnreadGroup > 99 ? "99+" : totalUnreadGroup}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Danh sách các đoạn chat */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchQuery?.trim()
              ? "Không tìm thấy đoạn chat phù hợp"
              : activeTab === "direct"
                ? "Chưa có đoạn chat với bạn bè"
                : activeTab === "group"
                  ? "Chưa tham gia nhóm chat nào"
                  : "Chưa có đoạn chat nào"}
          </div>
        ) : (
          filteredConversations.map((convo) =>
            convo.type === "direct" ? (
              <DirectMessageCard convo={convo} key={convo._id} />
            ) : (
              <GroupChatCard convo={convo} key={convo._id} />
            )
          )
        )}
      </div>
    </div>
  );
};

export default ConversationList;
