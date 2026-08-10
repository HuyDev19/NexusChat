import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { Trash2, ShieldAlert, UserPlus, Save } from "lucide-react";
import { useState } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import { Input } from "../ui/input";

export default function GroupSettingsModal({
  open,
  onOpenChange,
  conversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}) {
  const { user } = useAuthStore();
  const { friends } = useFriendStore();
  const {
    addGroupMembers,
    removeGroupMember,
    updateGroupRole,
    updateGroupInfo,
  } = useChatStore();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [groupName, setGroupName] = useState(conversation.group?.name || "");
  const [groupDesc, setGroupDesc] = useState(conversation.group?.description || "");

  const currentUser = conversation.participants.find((p) => p._id === user?._id);
  const isLeader = currentUser?.role === "leader";

  const handleAddMember = async () => {
    if (selectedFriends.length > 0) {
      await addGroupMembers(conversation._id, selectedFriends);
      setIsAddingMember(false);
      setSelectedFriends([]);
    }
  };

  const handleUpdateInfo = async () => {
    await updateGroupInfo(conversation._id, groupName, groupDesc);
    setIsEditingInfo(false);
  };

  const nonMemberFriends = friends.filter(
    (f) => !conversation.participants.some((p) => p._id === f._id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cài đặt nhóm</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Info Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Thông tin chung</h3>
            {isEditingInfo ? (
              <div className="space-y-2">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Tên nhóm"
                />
                <Input
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Mô tả nhóm"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditingInfo(false)}>Hủy</Button>
                  <Button onClick={handleUpdateInfo}><Save className="size-4 mr-2" />Lưu</Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-md">
                <div>
                  <p className="font-semibold">{conversation.group?.name}</p>
                  {conversation.group?.description && (
                    <p className="text-sm text-muted-foreground">{conversation.group?.description}</p>
                  )}
                </div>
                {isLeader && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)}>
                    Sửa
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Thành viên ({conversation.participants.length})</h3>
              <Button size="sm" onClick={() => setIsAddingMember(!isAddingMember)}>
                <UserPlus className="size-4 mr-2" /> Thêm bạn
              </Button>
            </div>

            {isAddingMember && (
              <div className="bg-secondary/30 p-3 rounded-md space-y-3">
                <h4 className="text-sm font-medium">Chọn bạn bè để thêm</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {nonMemberFriends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Không có bạn bè nào để thêm.</p>
                  ) : (
                    nonMemberFriends.map(friend => (
                      <div key={friend._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend._id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFriends([...selectedFriends, friend._id]);
                            else setSelectedFriends(selectedFriends.filter(id => id !== friend._id));
                          }}
                        />
                        <UserAvatar type="chat" name={friend.displayName as string} avatarUrl={friend.avatarUrl || undefined} />
                        <span className="text-sm">{friend.displayName}</span>
                      </div>
                    ))
                  )}
                </div>
                {selectedFriends.length > 0 && (
                  <Button size="sm" className="w-full" onClick={handleAddMember}>Xác nhận thêm</Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              {conversation.participants.map((p) => (
                <div key={p._id} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <UserAvatar type="chat" name={p.displayName as string} avatarUrl={p.avatarUrl || undefined} />
                    <div>
                      <p className="text-sm font-medium">
                        {p.displayName} {p._id === user?._id ? "(Bạn)" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{p.role}</p>
                    </div>
                  </div>

                  {isLeader && p._id !== user?._id && (
                    <div className="flex items-center gap-1">
                      {p.role === "member" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                          title="Phong trưởng nhóm"
                          onClick={() => updateGroupRole(conversation._id, p._id, "leader")}
                        >
                          <ShieldAlert className="size-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                        title="Xóa khỏi nhóm"
                        onClick={() => removeGroupMember(conversation._id, p._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
