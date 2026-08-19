import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { Camera, Edit2, LogOut, Save, Trash2, UserPlus, ShieldAlert, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import { Input } from "../ui/input";
import GroupChatAvatar from "./GroupChatAvatar";

export default function GroupSettingsModal({
  open,
  onOpenChange,
  conversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}) {
  const { user, fetchMe } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const {
    addGroupMembers,
    removeGroupMember,
    updateGroupRole,
    updateGroupInfo,
    updateGroupAvatar,
    convoLoading,
  } = useChatStore();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [memberToPromote, setMemberToPromote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && friends.length === 0) {
      getFriends();
    }
  }, [open, friends.length, getFriends]);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [groupName, setGroupName] = useState(conversation.group?.name || "");
  const [groupDesc, setGroupDesc] = useState(conversation.group?.description || "");

  const participants = conversation.participants || [];
  const currentUser = participants.find((p) => p._id === user?._id);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await updateGroupAvatar(conversation._id, file);
    }
  };

  const nonMemberFriends = friends.filter(
    (f) => !participants.some((p) => p._id === f._id)
  );

  if (!conversation || conversation.type === "direct") return null;

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
              <div className="flex flex-col sm:flex-row justify-between items-center bg-secondary/50 p-4 rounded-md gap-4">
                <div className="flex flex-col items-center gap-2 relative group">
                  <div className="size-24 relative">
                    <GroupChatAvatar
                      participants={participants}
                      type="profile"
                      groupAvatar={conversation.group?.avatar}
                      groupName={conversation.group?.name}
                    />
                    {/* Avatar Upload Overlay */}
                    {isLeader && (
                      <div 
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        onClick={() => !convoLoading && fileInputRef.current?.click()}
                      >
                        <Camera className="size-6 text-white" />
                      </div>
                    )}
                    {isLeader && conversation.group?.avatar && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-0 left-0 size-6 rounded-full shadow-md hover:scale-115 transition duration-300 z-30 bg-muted/80 hover:bg-muted text-muted-foreground"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm("Bạn có chắc muốn gỡ ảnh đại diện nhóm?")) {
                            await useChatStore.getState().removeGroupAvatar(conversation._id);
                          }
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={convoLoading}
                    />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold text-lg">{conversation.group?.name}</p>
                  {conversation.group?.description && (
                    <p className="text-sm text-muted-foreground">{conversation.group?.description}</p>
                  )}
                </div>
                {isLeader && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)}>
                    Sửa thông tin
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Thành viên ({participants.length})</h3>
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
              {participants.map((p) => (
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
                          onClick={() => setMemberToPromote(p._id)}
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

      <AlertDialog open={!!memberToPromote} onOpenChange={(open) => !open && setMemberToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận phong trưởng nhóm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn chuyển quyền trưởng nhóm cho người này không? Nếu chuyển, bạn sẽ trở thành thành viên thường.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (memberToPromote) {
                updateGroupRole(conversation._id, memberToPromote, "leader");
                setMemberToPromote(null);
                onOpenChange(false); // Đóng setting modal sau khi chuyển quyền
              }
            }}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
