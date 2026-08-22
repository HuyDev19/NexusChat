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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { Camera, Edit2, LogOut, Save, Trash2, UserPlus, ShieldAlert, Shield, ArrowDown, X, MoreHorizontal } from "lucide-react";
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
  const { user } = useAuthStore();
  const { friends, getFriends } = useFriendStore();
  const {
    addGroupMembers,
    removeGroupMember,
    updateGroupRole,
    updateGroupInfo,
    updateGroupAvatar,
    updateChannelVisibility,
    convoLoading,
  } = useChatStore();

  const [memberSearch, setMemberSearch] = useState("");
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
  const isDeputy = currentUser?.role === "deputy";

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

  const filteredParticipants = participants.filter((p) =>
    p.displayName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleBanMember = async (memberId: string, durationInDays: number | null) => {
    try {
      const durationMs = durationInDays ? durationInDays * 24 * 60 * 60 * 1000 : null;
      await chatService.banGroupMember(conversation._id, memberId, durationMs);
      toast.success("Đã cấm người dùng thành công");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cấm người dùng");
    }
  };

  if (!conversation || conversation.type === "direct") return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{conversation.type === "channel" ? "Cài đặt kênh" : "Cài đặt nhóm"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                  placeholder={conversation.type === "channel" ? "Mô tả kênh" : "Mô tả nhóm"}
                />
                {conversation.type === "channel" && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted/30 rounded-md border border-border/50">
                     <input 
                       type="checkbox" 
                       id="isPublicToggle" 
                       checked={conversation.isPublic}
                       onChange={async (e) => {
                         await updateChannelVisibility(conversation._id, e.target.checked);
                       }}
                       className="size-4"
                     />
                     <label htmlFor="isPublicToggle" className="text-sm font-medium select-none cursor-pointer">
                       Kênh công khai (Mọi người có thể tìm thấy kênh này)
                     </label>
                  </div>
                )}
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
                    {(isLeader || isDeputy) && (
                      <div
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        onClick={() => !convoLoading && fileInputRef.current?.click()}
                      >
                        <Camera className="size-6 text-white" />
                      </div>
                    )}
                    {(isLeader || isDeputy) && conversation.group?.avatar && (
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
                  {conversation.type === "channel" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 inline-block mt-1">
                      {conversation.isPublic ? "Công khai" : "Riêng tư"}
                    </span>
                  )}
                </div>
                {(isLeader || isDeputy) && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingInfo(true)}>
                    Sửa thông tin
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{conversation.type === "channel" ? "Người theo dõi" : "Thành viên"} ({participants.length})</h3>
              {(isLeader || isDeputy) && (
                <Button size="sm" onClick={() => setIsAddingMember(!isAddingMember)}>
                  <UserPlus className="size-4 mr-2" /> Thêm bạn
                </Button>
              )}
            </div>
            <Input 
              placeholder="Tìm kiếm..." 
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full bg-secondary"
            />

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

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredParticipants.map((p) => (
                <div key={p._id} className="flex items-center justify-between bg-secondary p-2 rounded-md">
                  <div className="flex items-center gap-3">
                    <UserAvatar type="chat" name={p.displayName as string} avatarUrl={p.avatarUrl || undefined} />
                    <div>
                      <p className="text-sm font-medium">
                        {p.displayName} {p._id === user?._id ? "(Bạn)" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {p.role === "leader" ? "TRƯỞNG NHÓM" : p.role === "deputy" ? "PHÓ NHÓM" : (conversation.type === "channel" ? "NGƯỜI THEO DÕI" : "THÀNH VIÊN")}
                      </p>
                    </div>
                  </div>

                  {((isLeader && p._id !== user?._id) || (isDeputy && p.role === "member" && p._id !== user?._id)) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {isLeader && p.role === "member" && (
                          <>
                            <DropdownMenuItem onClick={() => updateGroupRole(conversation._id, p._id, "deputy")}>
                              <Shield className="size-4 mr-2 text-blue-500" />
                              Phong phó nhóm
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMemberToPromote(p._id)}>
                              <ShieldAlert className="size-4 mr-2 text-yellow-500" />
                              Phong trưởng nhóm
                            </DropdownMenuItem>
                          </>
                        )}
                        {isLeader && p.role === "deputy" && (
                          <DropdownMenuItem onClick={() => updateGroupRole(conversation._id, p._id, "member")}>
                            <ArrowDown className="size-4 mr-2 text-orange-500" />
                            Giáng cấp
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50"
                          onClick={() => removeGroupMember(conversation._id, p._id)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Xóa khỏi nhóm
                        </DropdownMenuItem>
                        {conversation.type === "channel" && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-red-500 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/50">
                              <Trash2 className="size-4 mr-2" />
                              Cấm (Ban)
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleBanMember(p._id, 1)}>1 ngày</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBanMember(p._id, 7)}>1 tuần</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBanMember(p._id, 30)}>1 tháng</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBanMember(p._id, 365)}>1 năm</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBanMember(p._id, null)}>Vĩnh viễn</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <AlertDialogAction onClick={async () => {
              try {
                if (memberToPromote) {
                  await updateGroupRole(conversation._id, memberToPromote, "leader");
                  setMemberToPromote(null);
                  onOpenChange(false);
                }
              } catch (error: any) {
                toast.error(error.response?.data?.message || "Lỗi phong quyền");
              }
            }}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
