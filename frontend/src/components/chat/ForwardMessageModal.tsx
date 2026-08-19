import { useState, useMemo } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, Check } from "lucide-react";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import { toast } from "sonner";

const ForwardMessageModal = () => {
  const { forwardingMessage, setForwardingMessage, conversations, sendDirectMessage, sendGroupMessage } = useChatStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConvoIds, setSelectedConvoIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    return conversations.filter(c => {
      if (c.type === "group") {
        return c.group.name.toLowerCase().includes(searchQuery.toLowerCase());
      } else {
        const otherUser = c.participants.find(p => p._id !== user?._id);
        const name = c.nicknames?.[otherUser?._id || ""] || otherUser?.displayName || "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      }
    });
  }, [conversations, searchQuery, user?._id]);

  const handleToggleConvo = (id: string) => {
    setSelectedConvoIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleForward = async () => {
    if (!forwardingMessage || selectedConvoIds.length === 0) return;
    
    setIsSending(true);
    try {
      // Create promises for all forwards to run in parallel
      const forwardPromises = selectedConvoIds.map(convoId => {
        const convo = conversations.find(c => c._id === convoId);
        if (!convo) return Promise.resolve();

        if (convo.type === "direct") {
          const otherUser = convo.participants.find(p => p._id !== user?._id);
          if (!otherUser) return Promise.resolve();
          return sendDirectMessage(
            otherUser._id,
            forwardingMessage.content || "",
            forwardingMessage.imgUrl,
            forwardingMessage.audioUrl,
            undefined, // expiresIn
            false,     // isViewOnce
            undefined, // mentions
            undefined, // replyTo
            true,      // isForwarded
            convoId    // targetConversationId
          );
        } else {
          return sendGroupMessage(
            convoId,
            forwardingMessage.content || "",
            forwardingMessage.imgUrl,
            forwardingMessage.audioUrl,
            undefined,
            false,
            undefined,
            undefined,
            undefined,
            true
          );
        }
      });

      await Promise.all(forwardPromises);
      toast.success("Đã chuyển tiếp tin nhắn");
      setForwardingMessage(null);
      setSelectedConvoIds([]);
      setSearchQuery("");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi chuyển tiếp");
    } finally {
      setIsSending(false);
    }
  };

  if (!forwardingMessage) return null;

  return (
    <Dialog open={!!forwardingMessage} onOpenChange={(open) => !open && setForwardingMessage(null)}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Chuyển tiếp tới</DialogTitle>
        </DialogHeader>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bạn bè hoặc nhóm..."
              className="pl-9 bg-muted/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto beautiful-scrollbar p-2 space-y-1 min-h-[300px]">
          {filteredConversations.map((convo) => {
            const isGroup = convo.type === "group";
            const otherUser = isGroup ? null : convo.participants.find(p => p._id !== user?._id);
            const isSelected = selectedConvoIds.includes(convo._id);

            return (
              <div 
                key={convo._id}
                onClick={() => handleToggleConvo(convo._id)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    {isGroup ? (
                      <GroupChatAvatar
                        groupName={convo.group?.name}
                        avatarUrl={convo.group?.avatar}
                        participants={convo.participants}
                        type="chat"
                      />
                    ) : (
                      <UserAvatar
                        type="chat"
                        name={convo.nicknames?.[otherUser?._id || ""] || otherUser?.displayName || ""}
                        avatarUrl={otherUser?.avatarUrl}
                        isActive={otherUser?.presenceStatus === 'online'}
                      />
                    )}
                  </div>
                  <span className="font-medium text-sm">
                    {isGroup ? convo.group?.name : (convo.nicknames?.[otherUser?._id || ""] || otherUser?.displayName)}
                  </span>
                </div>

                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                  {isSelected && <Check className="size-3" />}
                </div>
              </div>
            );
          })}
          {filteredConversations.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Không tìm thấy kết quả nào
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedConvoIds.length > 0 ? `Đã chọn ${selectedConvoIds.length}` : "Chưa chọn người nhận"}
          </span>
          <Button 
            onClick={handleForward} 
            disabled={selectedConvoIds.length === 0 || isSending}
            className="gap-2"
          >
            <Send className="size-4" />
            Gửi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageModal;
