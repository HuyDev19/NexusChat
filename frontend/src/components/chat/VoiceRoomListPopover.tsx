import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Headset, Plus, Edit2, Trash2, Users, Loader2 } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { cn } from "@/lib/utils";
import type { Conversation, VoiceRoom } from "@/types/chat";
import UserAvatar from "./UserAvatar";

interface VoiceRoomListPopoverProps {
  chat: Conversation;
}

const VoiceRoomListPopover = ({ chat }: VoiceRoomListPopoverProps) => {
  const { user } = useAuthStore();
  const { joinRoomCall, activeVoiceRooms, activeCall } = useCallStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{ isOpen: boolean; room: VoiceRoom | null }>({ isOpen: false, room: null });
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const voiceRooms = chat?.group?.voiceRooms || [];

  // Kiểm tra quyền Trưởng/Phó nhóm
  const currentUserParticipant = chat.participants?.find(p => p._id === user?._id);
  const isAdmin = currentUserParticipant?.role === "leader" || currentUserParticipant?.role === "deputy";

  // Tổng số người đang trong các phòng của nhóm này
  const totalActiveUsers = voiceRooms.reduce((acc, room) => {
    const key = `${chat._id}:${room._id}`;
    return acc + (activeVoiceRooms[key]?.length || 0);
  }, 0);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      setIsLoading(true);
      await chatService.createVoiceRoom(chat._id, roomName);
      toast.success("Đã tạo phòng thoại mới");
      setShowCreateModal(false);
      setRoomName("");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo phòng thoại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoom = async () => {
    if (!roomName.trim() || !showEditModal.room) return;
    try {
      setIsLoading(true);
      await chatService.updateVoiceRoom(chat._id, showEditModal.room._id, roomName);
      toast.success("Đã cập nhật tên phòng");
      setShowEditModal({ isOpen: false, room: null });
      setRoomName("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Lỗi cập nhật phòng từ API:", error);
      toast.error(error.response?.data?.message || "Lỗi cập nhật phòng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, name: string) => {
    if (name === "Phòng chung") {
      toast.error("Không thể xóa phòng mặc định");
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa phòng "${name}"?`)) return;

    try {
      await chatService.deleteVoiceRoom(chat._id, roomId);
      toast.success("Đã xóa phòng");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi xóa phòng");
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (activeCall) {
      toast.error("Bạn đang trong một cuộc gọi khác");
      return;
    }
    joinRoomCall(chat._id, roomId);
    setIsOpen(false);
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "relative p-2 rounded-full transition-all duration-200 flex items-center justify-center",
              totalActiveUsers > 0
                ? "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
            title="Phòng thoại"
          >
            <Headset size={20} />
            {totalActiveUsers > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                {totalActiveUsers}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2 rounded-xl shadow-xl border-border/50">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border/50">
            <h4 className="font-semibold text-sm flex items-center gap-1.5">
              <Headset size={16} className="text-purple-500" /> Kênh Thoại
            </h4>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRoomName("");
                  setShowCreateModal(true);
                }}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title="Tạo phòng mới"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto beautiful-scrollbar">
            {voiceRooms.map((room) => {
              const activeUsers = activeVoiceRooms[`${chat._id}:${room._id}`] || [];
              const isGeneral = room.name === "Phòng chung";
              const isJoined = activeCall?.roomName === `group-call-${chat._id}-${room._id}`;

              return (
                <div key={room._id} className="flex flex-col gap-1 rounded-lg border border-transparent hover:border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors overflow-hidden">
                  <div className="flex items-center justify-between p-2 group">
                    <button
                      onClick={() => !isJoined && handleJoinRoom(room._id)}
                      disabled={isJoined}
                      className={cn(
                        "flex flex-1 items-center gap-2 text-sm text-left truncate transition-colors",
                        isJoined ? "text-green-500 font-semibold" : "text-foreground font-medium hover:text-primary"
                      )}
                    >
                      <span className="truncate">{room.name}</span>
                      {activeUsers.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-full font-bold ml-1">
                          <Users size={10} /> {activeUsers.length}
                        </span>
                      )}
                    </button>

                    {isAdmin && !isGeneral && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRoomName(room.name);
                            setShowEditModal({ isOpen: true, room });
                          }}
                          className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                          title="Sửa tên phòng"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room._id, room.name)}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                          title="Xóa phòng"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hiển thị avatar người đang trong phòng */}
                  {activeUsers.length > 0 && (
                    <div className="px-2 pb-2 flex items-center gap-1 flex-wrap">
                      {activeUsers.map(uid => {
                        const participant = chat.participants?.find(p => p._id === uid);
                        if (!participant) return null;
                        return (
                          <div key={uid} className="relative group/avatar" title={participant.displayName}>
                            <UserAvatar
                              type="chat"
                              userId={participant._id}
                              avatarUrl={participant.avatarUrl}
                              name={participant.displayName}
                            />
                            {uid === user?._id && (
                              <div className="absolute -inset-0.5 rounded-full border-2 border-green-500 pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {voiceRooms.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Chưa có phòng thoại nào
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Tạo phòng Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tạo phòng thoại mới</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="VD: Phòng chơi game..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && roomName.trim()) {
                  handleCreateRoom();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button onClick={handleCreateRoom} disabled={!roomName.trim() || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tạo phòng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sửa phòng Modal */}
      <Dialog open={showEditModal.isOpen} onOpenChange={(open) => setShowEditModal({ isOpen: open, room: showEditModal.room })}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Đổi tên phòng</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Tên phòng..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && roomName.trim()) {
                  handleEditRoom();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal({ isOpen: false, room: null })} disabled={isLoading}>
              Hủy
            </Button>
            <Button onClick={handleEditRoom} disabled={!roomName.trim() || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceRoomListPopover;
