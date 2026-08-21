import { useState } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { Search, X, Users, UserPlus, UsersRound, Archive, Plus } from "lucide-react";
import FriendListModal from "../createNewChat/FriendListModal";
import NewGroupChatModal from "./NewGroupChatModal";
import AddFriendModal from "./AddFriendModal";
import ArchivedChatsModal from "./ArchivedChatsModal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Dialog } from "../ui/dialog";

const CreateNewChat = () => {
  const { getFriends } = useFriendStore();
  const { searchQuery, setSearchQuery, archivedConversations } = useChatStore();

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const handleOpenFriendModal = async () => {
    await getFriends();
    setShowFriendModal(true);
  };

  const handleOpenGroupModal = async () => {
    await getFriends();
    setShowGroupModal(true);
  };

  const archivedCount = archivedConversations?.length || 0;

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        {/* Ô tìm kiếm tin nhắn / đoạn chat */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm kiếm bạn bè, nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs glass-light rounded-xl border-border/40 focus:border-purple-500 transition-all placeholder:text-muted-foreground/70"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nút cây bút tùy chọn */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              title="Tùy chọn đoạn chat"
              className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm relative"
            >
              <Plus className="w-5 h-5" />
              {archivedCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-background animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5 shadow-2xl">
            {/* 1. Kết bạn mới */}
            <DropdownMenuItem
              onClick={() => setShowAddFriendModal(true)}
              className="cursor-pointer rounded-xl font-medium text-xs py-2"
            >
              <UserPlus className="w-4 h-4 mr-2.5 text-sky-400" />
              <span>Kết bạn mới</span>
            </DropdownMenuItem>

            {/* 2. Tạo nhóm chat mới */}
            <DropdownMenuItem
              onClick={handleOpenGroupModal}
              className="cursor-pointer rounded-xl font-medium text-xs py-2"
            >
              <UsersRound className="w-4 h-4 mr-2.5 text-emerald-400" />
              <span>Tạo nhóm chat mới</span>
            </DropdownMenuItem>

            {/* 3. Danh sách bạn bè / Nhắn tin mới */}
            <DropdownMenuItem
              onClick={handleOpenFriendModal}
              className="cursor-pointer rounded-xl font-medium text-xs py-2"
            >
              <Users className="w-4 h-4 mr-2.5 text-purple-400" />
              <span>Danh sách bạn bè</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            {/* 4. Tin nhắn đã lưu trữ */}
            <DropdownMenuItem
              onClick={() => setShowArchivedModal(true)}
              className="cursor-pointer rounded-xl font-medium text-xs py-2 flex items-center justify-between"
            >
              <div className="flex items-center">
                <Archive className="w-4 h-4 mr-2.5 text-amber-400" />
                <span>Tin nhắn đã lưu trữ</span>
              </div>
              {archivedCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 text-[10px] font-bold">
                  {archivedCount}
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal Kết bạn mới */}
      <AddFriendModal open={showAddFriendModal} onOpenChange={setShowAddFriendModal} />

      {/* Modal Danh sách bạn bè */}
      <Dialog open={showFriendModal} onOpenChange={setShowFriendModal}>
        <FriendListModal />
      </Dialog>

      {/* Modal Tạo nhóm chat */}
      <NewGroupChatModal open={showGroupModal} onOpenChange={setShowGroupModal} />

      {/* Modal Tin nhắn đã lưu trữ */}
      <ArchivedChatsModal open={showArchivedModal} setOpen={setShowArchivedModal} />
    </>
  );
};

export default CreateNewChat;