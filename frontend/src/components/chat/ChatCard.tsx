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
}: ChatCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { deleteConversation } = useChatStore();

  const handleDelete = async () => {
    await deleteConversation(convoId);
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
                    className="text-destructive cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirm(true);
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Xóa đoạn chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa không ?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Đoạn chat này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
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