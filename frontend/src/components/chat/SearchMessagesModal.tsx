import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { chatService } from "@/services/chatService";
import type { Message, Conversation } from "@/types/chat";
import { Loader2, Search } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { formatMessageTime } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}

export default function SearchMessagesModal({ open, onOpenChange, conversation }: SearchMessagesModalProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setMessages([]);
    }
  }, [open]);

  useEffect(() => {
    let isMounted = true;
    const searchMessages = async (searchQuery: string) => {
      try {
        setLoading(true);
        const data = await chatService.searchMessages(conversation._id, searchQuery);
        if (isMounted) setMessages(data);
      } catch (error) {
        console.error("Lỗi tìm kiếm tin nhắn", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (open && conversation._id && debouncedQuery.trim()) {
      searchMessages(debouncedQuery);
    } else {
      setMessages([]);
    }
    return () => { isMounted = false; };
  }, [open, conversation._id, debouncedQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Tìm kiếm tin nhắn</DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              autoFocus
              placeholder="Nhập nội dung cần tìm..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && debouncedQuery.trim() !== "" ? (
            <div className="text-center text-muted-foreground p-8">
              Không tìm thấy tin nhắn nào.
            </div>
          ) : messages.length === 0 && debouncedQuery.trim() === "" ? (
            <div className="text-center text-muted-foreground p-8">
              Nhập từ khóa để tìm kiếm tin nhắn trong cuộc trò chuyện này.
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
