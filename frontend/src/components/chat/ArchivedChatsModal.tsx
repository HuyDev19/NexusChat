import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import { Button } from "@/components/ui/button";
import { ArchiveX, Archive } from "lucide-react";
import { toast } from "sonner";

interface ArchivedChatsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ArchivedChatsModal = ({ open, setOpen }: ArchivedChatsModalProps) => {
  const { user } = useAuthStore();
  const {
    conversations,
    archivedConversations,
    unarchiveConversation,
    setActiveConversation,
  } = useChatStore();

  const archivedList = conversations.filter((c) =>
    archivedConversations?.includes(c._id)
  );

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    setOpen(false);
  };

  const handleUnarchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unarchiveConversation(id);
    toast.success("Đã bỏ lưu trữ đoạn chat");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-6 rounded-3xl">
        <DialogHeader className="border-b border-border/40 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Archive className="w-5 h-5 text-purple-400" />
            <span>Tin nhắn đã lưu trữ ({archivedList.length})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-2 py-2 pr-1 min-h-[160px]">
          {archivedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs gap-2">
              <ArchiveX className="w-8 h-8 opacity-40 text-purple-400" />
              <span>Chưa có đoạn chat nào được lưu trữ.</span>
            </div>
          ) : (
            archivedList.map((convo) => {
              const isGroup = convo.type === "group";
              const otherUser = convo.participants?.find((p) => p._id !== user?._id);
              const name = isGroup
                ? convo.group?.name || "Nhóm"
                : otherUser?.displayName || "Người dùng";

              return (
                <div
                  key={convo._id}
                  onClick={() => handleSelect(convo._id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/40 hover:border-purple-500/40 hover:bg-muted/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isGroup ? (
                      <GroupChatAvatar
                        participants={convo.participants || []}
                        type="chat"
                        groupAvatar={convo.group?.avatar}
                        groupName={convo.group?.name}
                      />
                    ) : (
                      <UserAvatar
                        type="chat"
                        name={otherUser?.displayName || ""}
                        avatarUrl={otherUser?.avatarUrl || undefined}
                        className="w-10 h-10"
                      />
                    )}

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-xs truncate">{name}</span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {convo.lastMessage?.content?.startsWith("[STORY_REPLY] ") 
                          ? "Đã trả lời tin: " + convo.lastMessage.content.replace("[STORY_REPLY] ", "").replace("Đã trả lời tin của bạn: ", "").trim()
                          : convo.lastMessage?.content || (isGroup ? `${convo.participants?.length} thành viên` : "Đã bắt đầu đoạn chat")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleUnarchive(convo._id, e)}
                      title="Bỏ lưu trữ"
                      className="h-8 px-2 text-xs rounded-xl border-purple-500/30 text-purple-300 hover:bg-purple-500/10 gap-1"
                    >
                      <ArchiveX className="w-3.5 h-3.5" />
                      <span>Bỏ lưu trữ</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivedChatsModal;
