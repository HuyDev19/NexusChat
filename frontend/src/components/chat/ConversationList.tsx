import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import DirectMessageCard from "./DirectMessageCard";
import GroupChatCard from "./GroupChatCard";
import { removeVietnameseTones, cn } from "@/lib/utils";
import { MessageSquare, Users, UserCheck, Radio } from "lucide-react";

import { useFriendStore } from "@/stores/useFriendStore";

type FilterTab = "all" | "direct" | "group" | "channel";

const ConversationList = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const { conversations, searchQuery, archivedConversations, pinnedConversations } = useChatStore();
  const { user } = useAuthStore();
  const { friends } = useFriendStore();

  if (!conversations || !user) return null;

  // Lọc theo Tab và Search
  const filteredConversations = conversations.filter((convo) => {
    // Ẩn hội thoại lưu trữ
    if (archivedConversations?.includes(convo._id)) return false;

    // Lọc theo Tab (All, Bạn bè, Nhóm)
    if (activeTab === "direct") {
      if (convo.type !== "direct") return false;
      const otherUser = (convo.participants || []).find((p) => p._id !== user._id);
      if (otherUser && !friends.some((f) => f._id === otherUser._id)) {
        return false;
      }
    }
    if (activeTab === "group" && convo.type !== "group") return false;
    if (activeTab === "channel" && convo.type !== "channel") return false;

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

    if (convo.type === "group" || convo.type === "channel") {
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
  const getUnreadCount = (type?: "direct" | "group" | "channel") => {
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
  const totalUnreadChannel = getUnreadCount("channel");

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* 4 Nút chuyển đổi Tab (Dynamic Expanding Style) */}
      <div className="px-2 py-1.5 mb-1">
        <div className="flex w-full gap-1 p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/40 overflow-hidden">
          {/* 1. Tab Tất cả (All) */}
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ease-out",
              activeTab === "all"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 flex-1 px-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 w-[42px] flex-none px-0 relative"
            )}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            {activeTab === "all" && <span className="truncate whitespace-nowrap">Tất cả</span>}
            {totalUnreadAll > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center shrink-0",
                activeTab === "all" 
                  ? "bg-white text-purple-700" 
                  : "bg-purple-600 text-white absolute top-0.5 right-0.5 scale-75"
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
              "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ease-out",
              activeTab === "direct"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 flex-1 px-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 w-[42px] flex-none px-0 relative"
            )}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            {activeTab === "direct" && <span className="truncate whitespace-nowrap">Bạn bè</span>}
            {totalUnreadDirect > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center shrink-0",
                activeTab === "direct" 
                  ? "bg-white text-purple-700" 
                  : "bg-purple-600 text-white absolute top-0.5 right-0.5 scale-75"
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
              "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ease-out",
              activeTab === "group"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 flex-1 px-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 w-[42px] flex-none px-0 relative"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            {activeTab === "group" && <span className="truncate whitespace-nowrap">Nhóm</span>}
            {totalUnreadGroup > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center shrink-0",
                activeTab === "group" 
                  ? "bg-white text-purple-700" 
                  : "bg-purple-600 text-white absolute top-0.5 right-0.5 scale-75"
              )}>
                {totalUnreadGroup > 99 ? "99+" : totalUnreadGroup}
              </span>
            )}
          </button>

          {/* 4. Tab Kênh */}
          <button
            type="button"
            onClick={() => setActiveTab("channel")}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ease-out",
              activeTab === "channel"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 flex-1 px-3"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 w-[42px] flex-none px-0 relative"
            )}
          >
            <Radio className="w-4 h-4 shrink-0" />
            {activeTab === "channel" && <span className="truncate whitespace-nowrap">Kênh</span>}
            {totalUnreadChannel > 0 && (
              <span className={cn(
                "px-1 py-0.2 min-w-[14px] text-[10px] rounded-full font-bold leading-none flex items-center justify-center shrink-0",
                activeTab === "channel" 
                  ? "bg-white text-purple-700" 
                  : "bg-purple-600 text-white absolute top-0.5 right-0.5 scale-75"
              )}>
                {totalUnreadChannel > 99 ? "99+" : totalUnreadChannel}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Danh sách các đoạn chat */}
      <div className="flex-1 overflow-y-auto beautiful-scrollbar p-2 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchQuery?.trim()
              ? "Không tìm thấy đoạn chat phù hợp"
              : activeTab === "direct"
                ? "Chưa có đoạn chat với bạn bè"
                : activeTab === "group"
                  ? "Chưa tham gia nhóm chat nào"
                  : activeTab === "channel"
                    ? "Chưa tham gia kênh nào"
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
