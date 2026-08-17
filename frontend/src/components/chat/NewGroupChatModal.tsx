import { useFriendStore } from "@/stores/useFriendStore";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { UserPlus, Users, Search, Check } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import type { Friend } from "@/types/user";
import UserAvatar from "./UserAvatar";
import SelectedUsersList from "../newGroupChat/SelectedUsersList";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";

import { useEffect } from "react";

interface NewGroupChatModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preSelectedFriend?: Friend;
}

const NewGroupChatModal = ({ open, onOpenChange, preSelectedFriend }: NewGroupChatModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const { friends, getFriends } = useFriendStore();
  const [invitedUsers, setInvitedUsers] = useState<Friend[]>([]);
  const { loading, createConversation } = useChatStore();

  useEffect(() => {
    if (open) {
      getFriends();
      if (preSelectedFriend) {
        setInvitedUsers([preSelectedFriend]);
      }
    }
  }, [open, preSelectedFriend, getFriends]);

  const toggleSelectFriend = (friend: Friend) => {
    const isSelected = invitedUsers.some((u) => u._id === friend._id);
    if (isSelected) {
      setInvitedUsers(invitedUsers.filter((u) => u._id !== friend._id));
    } else {
      setInvitedUsers([...invitedUsers, friend]);
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    setInvitedUsers(invitedUsers.filter((u) => u._id !== friend._id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!groupName.trim()) {
        toast.warning("Vui lòng nhập tên nhóm chat");
        return;
      }
      if (invitedUsers.length === 0) {
        toast.warning("Bạn phải chọn ít nhất 1 thành viên vào nhóm");
        return;
      }

      await createConversation(
        "group",
        groupName.trim(),
        invitedUsers.map((u) => u._id)
      );

      setGroupName("");
      setSearch("");
      setInvitedUsers([]);
      if (onOpenChange) onOpenChange(false);
      toast.success("Tạo nhóm chat mới thành công!");
    } catch (error) {
      console.error("Lỗi xảy ra khi handleSubmit trong NewGroupChatModal:", error);
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.displayName.toLowerCase().includes(search.toLowerCase()) ||
    friend.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-purple-500/30 shadow-2xl">
        <DialogHeader className="border-b border-border/40 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Tạo nhóm chat mới</span>
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
          {/* Tên nhóm */}
          <div className="space-y-1.5">
            <Label htmlFor="groupName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tên nhóm chat
            </Label>
            <Input
              id="groupName"
              placeholder="Gõ tên nhóm vào đây..."
              className="h-10 rounded-xl bg-muted/40 border-border/70 text-xs focus:border-purple-500"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* Mời thành viên */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mời thành viên ({invitedUsers.length} đã chọn)
              </Label>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs bg-muted/30 border-border/50"
              />
            </div>

            {/* Danh sách thành viên đã chọn (Chức năng xóa nhanh) */}
            {invitedUsers.length > 0 && (
              <SelectedUsersList
                invitedUsers={invitedUsers}
                onRemove={handleRemoveFriend}
              />
            )}

            {/* DANH SÁCH BẠN BÈ CUỘN CHỌN TRỰC TIẾP */}
            <div className="border border-border/40 rounded-2xl p-1.5 max-h-[250px] min-h-[180px] overflow-y-auto space-y-1 bg-muted/20">
              {filteredFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-muted-foreground text-xs gap-1.5">
                  <Users className="w-8 h-8 opacity-40 text-purple-400" />
                  <span>{search ? "Không tìm thấy bạn bè phù hợp" : "Danh sách bạn bè trống."}</span>
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isChecked = invitedUsers.some((u) => u._id === friend._id);

                  return (
                    <div
                      key={friend._id}
                      onClick={() => toggleSelectFriend(friend)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border",
                        isChecked
                          ? "bg-purple-500/15 border-purple-500/40"
                          : "bg-card/40 border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          type="chat"
                          name={friend.displayName}
                          avatarUrl={friend.avatarUrl}
                          className="w-9 h-9"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs truncate">{friend.displayName}</span>
                          <span className="text-[10px] text-muted-foreground truncate">@{friend.username}</span>
                        </div>
                      </div>

                      {/* Checkbox Icon */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-lg flex items-center justify-center border transition-all",
                          isChecked
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "border-border/60 bg-muted/30"
                        )}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading || invitedUsers.length === 0 || !groupName.trim()}
              className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs gap-2 shadow-md shadow-purple-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo nhóm chat ({invitedUsers.length} thành viên)</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupChatModal;