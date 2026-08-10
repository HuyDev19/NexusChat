import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isGroup?: boolean;
  isLeader?: boolean;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
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
  isGroup,
  isLeader,
}: ChatCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState<"clear" | "leave" | "disband" | null>(null);
  
  const { clearChatHistory, leaveGroup, deleteConversation } = useChatStore();

  const handleConfirm = async () => {
    if (confirmType === "clear") await clearChatHistory(convoId);
    else if (confirmType === "leave") await leaveGroup(convoId);
    else if (confirmType === "disband") await deleteConversation(convoId);
    setShowConfirm(false);
    setConfirmType(null);
  };

  return (
    <>
      <Card
        className={cn(
          "group border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
          isActive &&
            "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
        )}
        onClick={() => onSelect(convoId)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">{leftSection}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3
                className={cn(
                  "font-semibold text-sm truncate",
                  unreadCount && unreadCount > 0 && "text-foreground"
                )}
              >
                {name}
              </h3>

              <span className="text-xs text-muted-foreground">
                {timestamp ? formatOnlineTime(timestamp) : ""}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 flex-1 min-w-0">{subtitle}</div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div onClick={(e) => e.stopPropagation()} className="p-1 rounded-full hover:bg-accent/50 cursor-pointer text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth">
                    <MoreHorizontal className="size-4 hover:size-5" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmType("clear");
                      setShowConfirm(true);
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Xóa đoạn chat
                  </DropdownMenuItem>

                  {isGroup && (
                    <DropdownMenuItem
                      className="cursor-pointer"
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

                  {isGroup && isLeader && (
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer"
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
              {confirmType === "disband" && "Bạn có chắc chắn muốn giải tán nhóm?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmType === "clear" && "Hành động này sẽ xóa/ẩn lịch sử tin nhắn ở phía bạn."}
              {confirmType === "leave" && "Bạn sẽ không thể nhận tin nhắn từ nhóm này nữa trừ khi được thêm lại."}
              {confirmType === "disband" && "Hành động này không thể hoàn tác. Nhóm sẽ bị xóa vĩnh viễn với tất cả mọi người."}
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
    </>
  );
};

export default ChatCard;