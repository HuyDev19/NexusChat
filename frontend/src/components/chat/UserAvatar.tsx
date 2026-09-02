import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useState } from "react";
import { Send } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface IUserAvatarProps {
  type: "sidebar" | "chat" | "profile";
  name: string;
  avatarUrl?: string | null;
  className?: string;
  note?: string;
  userId?: string;
  isIncognito?: boolean;
}

const UserAvatar = ({ type, name, avatarUrl, className, note, userId, isIncognito }: IUserAvatarProps) => {
  const bgColor = !avatarUrl ? "bg-blue-500" : "";
  const [replyText, setReplyText] = useState("");
  const [open, setOpen] = useState(false);
  const { sendDirectMessage } = useChatStore();
  const { user } = useAuthStore();
  const noteContent = typeof note === "string" ? note : (note as any)?.content || undefined;

  const getTruncatedNote = (text: any) => {
    const str = typeof text === "string" ? text : (text?.content || "");
    const words = str.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 3) return str;
    return words.slice(0, 3).join(" ") + "...";
  };

  const handleReply = async () => {
    if (!replyText.trim() || !userId || !noteContent) return;
    try {
      await sendDirectMessage(userId, `Phản hồi ghi chú "${noteContent}": ${replyText}`);
      setReplyText("");
      setOpen(false);
      toast.success("Đã gửi phản hồi");
    } catch (error) {
      toast.error("Không thể gửi phản hồi");
    }
  };

  const displayName = name || "Nexus";

  return (
    <div className="relative inline-block">
      <Avatar
        className={cn(
          className ?? "",
          type === "sidebar" && "size-12 text-base",
          type === "chat" && "size-8 text-sm",
          type === "profile" && "size-24 text-3xl shadow-md",
          isIncognito && "bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-border"
        )}
      >
        {isIncognito ? (
          <div className="flex items-center justify-center w-full h-full text-zinc-700 dark:text-zinc-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[60%] h-[60%]">
              <path d="M12 2.5a.75.75 0 0 1 .633.344l3.75 5.656H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h4.617l3.75-5.656A.75.75 0 0 1 12 2.5Zm-4.25 9.5a3.75 3.75 0 1 0 1.63 7.126A3.727 3.727 0 0 0 12 17.5a3.727 3.727 0 0 0 2.62 1.626 3.75 3.75 0 1 0 1.63-7.126 3.75 3.75 0 0 0-3.328 2.05h-1.844A3.75 3.75 0 0 0 7.75 12Zm0 1.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm8.5 0a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Z" />
            </svg>
          </div>
        ) : (
          <>
            <AvatarImage
              src={avatarUrl || undefined}
              alt={displayName}
            />
            <AvatarFallback className={`${bgColor} text-white font-semibold`}>
              {displayName.charAt(0)}
            </AvatarFallback>
          </>
        )}
      </Avatar>

    {noteContent && (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div 
            className="absolute -top-3 -right-2 bg-popover text-popover-foreground border border-border shadow-md rounded-2xl px-2 py-1 z-50 animate-in zoom-in duration-300 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            style={{ maxWidth: '120px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] sm:text-xs truncate">{getTruncatedNote(noteContent)}</p>
            <div className="absolute -bottom-1 right-3 size-2 bg-popover border-r border-b border-border rotate-45"></div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 shadow-xl rounded-xl z-[9999] border-border bg-popover text-popover-foreground" side="top" align="center">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/60 rounded-xl p-2.5 text-sm text-foreground break-words whitespace-pre-wrap leading-snug">
                {noteContent}
              </div>
            </div>
            
            {userId && user?._id !== userId && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder={`Trả lời ${name}...`}
                  className="flex-1 bg-muted/80 text-foreground placeholder:text-muted-foreground rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleReply();
                  }}
                />
                <button 
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )}
    </div>
  );
};

export default UserAvatar;
