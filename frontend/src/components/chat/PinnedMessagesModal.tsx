import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { chatService } from "@/services/chatService";
import type { Message, Conversation } from "@/types/chat";
import { Loader2 } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { formatMessageTime } from "@/lib/utils";

interface PinnedMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}

export default function PinnedMessagesModal({ open, onOpenChange, conversation }: PinnedMessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPinnedMessages = async () => {
      try {
        setLoading(true);
        const data = await chatService.getPinnedMessages(conversation._id);
        if (isMounted) setMessages(data);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn ghim", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (open && conversation._id) {
      fetchPinnedMessages();
    }
    return () => { isMounted = false; };
  }, [open, conversation._id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Tin nhắn đã ghim</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              Không có tin nhắn nào được ghim.
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="flex gap-3 bg-secondary/30 p-3 rounded-lg border border-border/50">
                <UserAvatar 
                  type="chat" 
                  name={msg.senderId?.displayName || "User"} 
                  avatarUrl={msg.senderId?.avatarUrl} 
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">
                      {msg.senderId?.displayName || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatMessageTime(new Date(msg.createdAt))}
                    </span>
                  </div>
                  <div className="text-sm break-words whitespace-pre-wrap">
                    {msg.content || (msg.imgUrl ? "[Hình ảnh]" : msg.audioUrl ? "[Tin nhắn thoại]" : "[Tệp đính kèm]")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
