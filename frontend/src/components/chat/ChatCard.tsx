import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal, Trash2, Archive, Bell, BellOff, Flag, Pin, PinOff, UserPlus, LogOut } from "lucide-react";
import NewGroupChatModal from "./NewGroupChatModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
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
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isGroup?: boolean;
  isChannel?: boolean;
  isLeader?: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
  rightSection?: React.ReactNode;
  targetUser?: { _id: string; displayName: string; username?: string; avatarUrl?: string };
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
  rightSection,
  isGroup,
  isChannel,
  isLeader,
  targetUser,
}: ChatCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [confirmType, setConfirmType] = useState<"clear" | "leave" | "disband" | "leaveChannel" | "deleteChannel" | null>(null);
  const [deleteChannelPassword, setDeleteChannelPassword] = useState("");
  
  const {
    clearChatHistory,
    leaveGroup,
    deleteConversation,
    archiveConversation,
    muteConversation,
    unmuteConversation,
    mutedConversations,
    pinnedConversations,
    pinConversation,
    unpinConversation,
  } = useChatStore();

  const isPinned = pinnedConversations?.includes(convoId);

  const isMuted =
    mutedConversations?.[convoId] &&
    (mutedConversations[convoId] === -1 || mutedConversations[convoId] > Date.now());

  const handleConfirm = async () => {
    try {
      if (confirmType === "clear") await clearChatHistory(convoId);
      else if (confirmType === "leave" || confirmType === "leaveChannel") await leaveGroup(convoId);
      else if (confirmType === "disband") await deleteConversation(convoId);
      else if (confirmType === "deleteChannel") {
        if (!deleteChannelPassword) {
          toast.error("Vui lòng nhập mật khẩu");
          return;
        }
        await deleteConversation(convoId, deleteChannelPassword);
        toast.success("Đã xóa kênh");
      }
      setShowConfirm(false);
      setConfirmType(null);
      setDeleteChannelPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group border-none p-3 cursor-pointer transition-all duration-300 glass hover:bg-muted/40 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-[1px]",
          isActive &&
            "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
        )}
        onClick={() => onSelect(convoId)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">{leftSection}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-sm truncate flex items-center gap-1.5">
                  {name}
                  {isPinned && <Pin className="w-3 h-3 text-purple-400 fill-purple-400 shrink-0" />}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {rightSection}
                  {timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {formatOnlineTime(timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1 min-w-0">{subtitle}</div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div onClick={(e) => e.stopPropagation()} className="p-1 rounded-full hover:bg-accent/50 cursor-pointer text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth">
                    <MoreHorizontal className="size-4 hover:size-5" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-2xl">
                  {/* 0. Ghim trò chuyện */}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPinned) {
                        unpinConversation(convoId);
                        toast.success("Đã bỏ ghim trò chuyện");
                      } else {
                        pinConversation(convoId);
                        toast.success("Đã ghim trò chuyện lên đầu");
                      }
                    }}
                  >
                    {isPinned ? (
                      <>
                        <PinOff className="size-4 mr-2 text-purple-400" />
                        Bỏ ghim trò chuyện
                      </>
                    ) : (
                      <>
                        <Pin className="size-4 mr-2 text-purple-400" />
                        Ghim trò chuyện lên đầu
                      </>
                    )}
                  </DropdownMenuItem>

                  {/* 0.5. Tạo nhóm với người này */}
                  {!isGroup && targetUser && (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg font-medium text-xs text-purple-300 hover:text-purple-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateGroupModal(true);
                      }}
                    >
                      <UserPlus className="size-4 mr-2 text-emerald-400" />
                      Tạo nhóm với {name}
                    </DropdownMenuItem>
                  )}

                  {/* 1. Lưu trữ đoạn chat */}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveConversation(convoId);
                      toast.success("Đã lưu trữ đoạn chat");
                    }}
                  >
                    <Archive className="size-4 mr-2 text-indigo-400" />
                    Lưu trữ đoạn chat
                  </DropdownMenuItem>

                  {/* 2. Tắt thông báo (Sub Menu) */}
                  {isMuted ? (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        unmuteConversation(convoId);
                        toast.success("Đã bật lại thông báo");
                      }}
                    >
                      <Bell className="size-4 mr-2 text-green-400" />
                      Bật lại thông báo
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer rounded-lg">
                        <BellOff className="size-4 mr-2 text-amber-400" />
                        Tắt thông báo
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48 rounded-xl p-1 shadow-xl">
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            muteConversation(convoId, 5 * 60 * 1000);
                            toast.success("Đã tắt thông báo 5 phút");
                          }}
                        >
                          Tắt 5 phút
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            muteConversation(convoId, 60 * 60 * 1000);
                            toast.success("Đã tắt thông báo 1 tiếng");
                          }}
                        >
                          Tắt 1 tiếng
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            muteConversation(convoId, 6 * 60 * 60 * 1000);
                            toast.success("Đã tắt thông báo 6 tiếng");
                          }}
                        >
                          Tắt 6 tiếng
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer rounded-lg text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            muteConversation(convoId);
                            toast.success("Đã tắt thông báo cho đến khi mở lại");
                          }}
                        >
                          Cho đến khi mở lại
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}

                  {/* 3. Báo cáo xấu */}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg text-rose-400 focus:text-rose-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.success("Đã gửi báo cáo người dùng đến Quản trị viên!");
                    }}
                  >
                    <Flag className="size-4 mr-2" />
                    Báo cáo xấu người này
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* 4. Xóa đoạn chat */}
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmType("clear");
                      setShowConfirm(true);
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Xóa đoạn chat
                  </DropdownMenuItem>

                  {isGroup && !isChannel && (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmType("leave");
                        setShowConfirm(true);
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Rời nhóm
                    </DropdownMenuItem>
                  )}

                  {isGroup && !isChannel && isLeader && (
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmType("disband");
                        setShowConfirm(true);
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Giải tán nhóm
                    </DropdownMenuItem>
                  )}

                  {isChannel && !isLeader && (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmType("leaveChannel");
                        setShowConfirm(true);
                      }}
                    >
                      <LogOut className="size-4 mr-2" />
                      Rời kênh
                    </DropdownMenuItem>
                  )}

                  {isChannel && isLeader && (
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmType("deleteChannel");
                        setShowConfirm(true);
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Xóa kênh
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmType === "clear" && "Bạn có chắc chắn muốn xóa đoạn chat này?"}
              {confirmType === "leave" && "Bạn có chắc chắn muốn rời nhóm?"}
              {confirmType === "leaveChannel" && "Bạn có chắc chắn muốn rời kênh?"}
              {confirmType === "disband" && "Bạn có chắc chắn muốn giải tán nhóm?"}
              {confirmType === "deleteChannel" && "Xác nhận xóa kênh"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-4 mt-2">
                {confirmType === "clear" && <span>Hành động này sẽ xóa/ẩn lịch sử tin nhắn ở phía bạn.</span>}
                {confirmType === "leave" && <span>Bạn sẽ không thể nhận tin nhắn từ nhóm này nữa trừ khi được thêm lại.</span>}
                {confirmType === "leaveChannel" && <span>Bạn sẽ không thể xem thông tin kênh này nữa.</span>}
                {confirmType === "disband" && <span>Hành động này không thể hoàn tác. Nhóm sẽ bị xóa vĩnh viễn với tất cả mọi người.</span>}
                {confirmType === "deleteChannel" && (
                  <>
                    <span>Hành động này không thể hoàn tác. Kênh và toàn bộ tin nhắn sẽ bị xóa vĩnh viễn khỏi hệ thống. Vui lòng nhập mật khẩu tài khoản để xác nhận.</span>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu tài khoản của bạn"
                      value={deleteChannelPassword}
                      onChange={(e) => setDeleteChannelPassword(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => {
              e.stopPropagation();
              setConfirmType(null);
            }}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleConfirm();
              }}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Tạo nhóm chat với người dùng này */}
      <NewGroupChatModal
        open={showCreateGroupModal}
        onOpenChange={setShowCreateGroupModal}
        preSelectedFriend={
          targetUser
            ? {
                _id: targetUser._id,
                displayName: targetUser.displayName,
                username: targetUser.username || "",
                avatarUrl: targetUser.avatarUrl || undefined,
              }
            : undefined
        }
      />
    </>
  );
};

export default ChatCard;