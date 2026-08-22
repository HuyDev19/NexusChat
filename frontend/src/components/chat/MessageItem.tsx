import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Play, Pause, Pin, PinOff, Timer, EyeOff, Eye, Undo2, MoreHorizontal, Reply, Forward } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAccountInfoModalStore } from "@/stores/useAccountInfoModalStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "🔥"];

const FormattedText = ({
  content,
  participants,
  nicknames,
  isOwn,
}: {
  content?: string | null;
  participants: Participant[];
  nicknames?: Record<string, string>;
  isOwn?: boolean;
}) => {
  if (!content) return null;

  const names = participants.map((p) => nicknames?.[p._id] || p.displayName).filter(Boolean);
  names.push("All", "Mọi người");
  names.sort((a, b) => b.length - a.length);
  const escapedNames = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const mentionPattern = names.length > 0 ? `@(?:${escapedNames.join("|")})` : `@_NEVER_MATCH_`;
  const urlPattern = `https?:\\/\\/[^\\s]+`;
  const combinedRegex = new RegExp(`(${mentionPattern}|${urlPattern})`, "g");

  const parts = content.split(combinedRegex);

  return (
    <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith("@")) {
          const mentionName = part.slice(1);
          return (
            <span
              key={i}
              className={cn(
                "font-bold cursor-pointer hover:underline",
                isOwn ? "text-primary-foreground" : "text-primary"
              )}
              title={
                mentionName === "All" || mentionName === "Mọi người"
                  ? "Nhắc cả nhóm"
                  : `Tên gốc: ${mentionName}`
              }
            >
              {part}
            </span>
          );
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const VoiceMessagePlayer = ({ src, isOwn }: { src: string; isOwn?: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleSpeed = () => {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  };

  return (
    <div className={cn("flex items-center gap-3 w-48 lg:w-56", isOwn ? "text-primary-foreground" : "")}>
      <button
        onClick={togglePlay}
        className={cn("shrink-0 size-8 flex items-center justify-center rounded-full transition-colors",
          isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
      >
        {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
      </button>
      
      <div className="flex-1 h-8 relative flex items-center">
        {/* Fake waveform */}
        <div className="absolute inset-0 flex items-center justify-between gap-[2px] opacity-60">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={cn("w-1 rounded-full", isOwn ? "bg-white" : "bg-primary")} style={{ height: `${20 + Math.random() * 80}%` }} />
          ))}
        </div>
        {/* Progress overlay */}
        <div className="absolute inset-0 bg-black/20" style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }} />
      </div>

      <button
        onClick={toggleSpeed}
        className="shrink-0 text-xs font-semibold px-1 py-0.5 rounded opacity-80 hover:opacity-100 transition-opacity"
      >
        {speed}x
      </button>
    </div>
  );
};

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "đã gửi" | "đã nhận" | "đã xem";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const { reactToMessage, pinMessage, recallMessage, markMediaAsViewed, voteOnPoll, setReplyingToMessage, setForwardingMessage } = useChatStore();
  const { user } = useAuthStore();
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
    new Date(prev?.createdAt || 0).getTime() >
    300000; // 5 phút

  const senderIdStr = typeof message.senderId === "object" ? (message.senderId as any)?._id || String(message.senderId) : String(message.senderId);
  const prevSenderIdStr = prev?.senderId ? (typeof prev.senderId === "object" ? (prev.senderId as any)?._id || String(prev.senderId) : String(prev.senderId)) : undefined;

  const isGroupBreak = isShowTime || senderIdStr !== prevSenderIdStr;

  const participants = selectedConvo.participants || [];
  const participant = participants.find(
    (p: Participant) => p._id?.toString() === senderIdStr
  );

  const isAI = senderIdStr === "000000000000000000000000";

  const isChannel = selectedConvo.type === "channel";
  const currentUserParticipant = selectedConvo.participants?.find((p: Participant) => p._id === user?._id);
  const isChannelAdmin = isChannel && (currentUserParticipant?.role === "leader" || currentUserParticipant?.role === "deputy");
  const canPin = !isChannel || isChannelAdmin;
  const canReply = !isChannel || isChannelAdmin;

  const getDisplayName = (): string => {
    if (isAI) return "NexusAI";
    if (!participant) return "Unknown";
    return (selectedConvo.nicknames?.[participant._id] || participant.displayName || "Unknown");
  };

  const getAvatarUrl = (): string | undefined => {
    if (isAI) return "https://cdn-icons-png.flaticon.com/512/826/826963.png";
    return participant?.avatarUrl || undefined;
  };

  // Group reactions
  const reactionCounts: Record<string, number> = {};
  const userReaction = message.reactions?.find(r => r.userId === user?._id)?.emoji;
  message.reactions?.forEach(r => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showViewOnceModal, setShowViewOnceModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (message.expiresAt) {
      const expiresAt = new Date(message.expiresAt).getTime();
      
      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = expiresAt - now;
        if (diff <= 0) {
          setTimeLeft(0);
        } else {
          setTimeLeft(Math.floor(diff / 1000));
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else if (message.expiresIn) {
      setTimeLeft(message.expiresIn);
    }
  }, [message.expiresAt, message.expiresIn]);

  const formatTimeLeft = (sec: number | null) => {
    if (sec === null) return "";
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec/60)}m ${sec%60}s`;
    return `${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m`;
  };

  if (timeLeft === 0) return null;

  const hasViewed = message.viewedBy?.includes(user?._id || "");

  const handleOpenViewOnce = () => {
    if (!hasViewed && !message.isOwn) {
      markMediaAsViewed(message._id);
    }
    setShowViewOnceModal(true);
  };

  return (
    <>
      {/* time */}
      {/* time - removed centered time */}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start",
          `message-${message._id}`
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (!isAI && senderIdStr) {
                    useAccountInfoModalStore.getState().openAccountModal(senderIdStr);
                  }
                }}
              >
                <UserAvatar
                  type="chat"
                  name={getDisplayName()}
                  avatarUrl={getAvatarUrl()}
                />
              </div>
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col group relative",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {!message.isOwn && selectedConvo.type === "group" && isGroupBreak && (
             <span 
               className="text-[11px] text-muted-foreground ml-1 mb-0.5 cursor-pointer hover:underline"
               onClick={() => {
                 if (!isAI && senderIdStr) {
                   useAccountInfoModalStore.getState().openAccountModal(senderIdStr);
                 }
               }}
             >
               {getDisplayName()}
             </span>
          )}

          {message.replyTo && (
            <div
              className="flex items-center gap-2 mb-1 px-3 py-1.5 bg-muted/40 rounded-lg border-l-2 border-primary cursor-pointer hover:bg-muted/60 transition-colors max-w-full"
              onClick={() => {
                const el = document.querySelector(`.message-${message.replyTo?._id}`);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                el?.classList.add("bg-primary/20", "transition-colors", "duration-500");
                setTimeout(() => el?.classList.remove("bg-primary/20"), 1500);
              }}
            >
              <Reply className="size-3 text-muted-foreground shrink-0" />
              <div className="flex flex-col text-[11px] min-w-0">
                <span className="font-semibold text-primary truncate">
                  {message.replyTo.senderId === user?._id ? "Bạn" : (selectedConvo.participants.find(p => p._id === message.replyTo?.senderId)?.displayName || "người dùng")}
                </span>
                <span className="text-muted-foreground truncate">
                  {message.replyTo.isRecalled ? "Tin nhắn đã thu hồi" : message.replyTo.audioUrl ? "🎵 Tin nhắn thoại" : message.replyTo.imgUrl ? "🖼️ Hình ảnh" : message.replyTo.content}
                </span>
              </div>
            </div>
          )}

          {message.isForwarded && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground italic mb-0.5 ml-1">
              <Forward className="size-3" />
              <span>Đã chuyển tiếp</span>
            </div>
          )}

          <div className="flex items-center gap-2 max-w-full group/actions">
            {message.isPinned && (
              <div className="flex items-center text-[10px] font-medium text-muted-foreground mb-0.5 gap-1">
                <Pin className="size-3" /> Đã ghim
              </div>
            )}
          </div>

          <div className={cn("relative flex items-center gap-2", message.isOwn ? "flex-row-reverse" : "flex-row")}>
            <Card
              onDoubleClick={() => !message.isRecalled && reactToMessage(message._id, '❤️')}
              className={cn(
                "p-3 relative select-none transition-all duration-300 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-[1px]",
                message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received",
                message.isRecalled ? "bg-muted/50 border border-border" : ""
              )}
            >
              {message.isRecalled ? (
                <div className="text-sm italic text-muted-foreground break-words whitespace-pre-wrap flex items-center gap-2">
                  <Undo2 className="size-4" /> Tin nhắn đã bị thu hồi
                </div>
              ) : message.isViewOnce && !message.isOwn && !hasViewed ? (
                <Button 
                  onClick={handleOpenViewOnce}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Eye className="size-4" /> Xem một lần
                </Button>
              ) : message.isViewOnce && !message.isOwn && hasViewed ? (
                <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                  <EyeOff className="size-4" /> Đã xem
                </div>
              ) : message.audioUrl ? (
                <VoiceMessagePlayer src={message.audioUrl} isOwn={message.isOwn} />
              ) : message.imgUrl ? (
                <div className="space-y-1.5">
                  <img 
                    src={message.imgUrl} 
                    alt="Image" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(message.imgUrl || null);
                    }}
                    className="rounded-md max-w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-95 hover:brightness-105 transition-all shadow-xs" 
                    title="Bấm để xem ảnh phóng to"
                  />
                  {message.content && (
                    <div className="pt-0.5">
                      <FormattedText content={message.content} participants={participants} nicknames={selectedConvo.nicknames} isOwn={message.isOwn} />
                    </div>
                  )}
                </div>
              ) : message.poll && message.poll.options && message.poll.options.length > 0 ? (
                <div className="space-y-3 min-w-[200px]">
                  <p className="font-semibold">{message.poll.question}</p>
                  <div className="space-y-2">
                    {message.poll.options.map((option, idx) => {
                      const votes = option.votes || [];
                      const totalVotes = message.poll!.options.reduce((sum, o) => sum + (o.votes || []).length, 0);
                      const percentage = totalVotes > 0 ? Math.round((votes.length / totalVotes) * 100) : 0;
                      const hasVoted = votes.includes(user?._id || "");
                      
                      return (
                        <div key={option._id || idx} className="relative group cursor-pointer" onClick={() => voteOnPoll(message._id, idx)}>
                          <div className={cn(
                            "absolute inset-0 rounded-md transition-all", 
                            message.isOwn ? "bg-primary-foreground/20" : "bg-primary/20",
                            hasVoted ? "border border-primary-foreground/50" : ""
                          )} style={{ width: `${percentage}%` }} />
                          <div className={cn(
                            "relative flex justify-between items-center p-2 rounded-md transition-colors",
                            message.isOwn ? "hover:bg-primary-foreground/10" : "hover:bg-primary/10"
                          )}>
                            <span className="text-sm z-10">{option.text}</span>
                            <span className="text-xs font-medium z-10">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-right opacity-70">
                    {message.poll.options.reduce((sum, o) => sum + (o.votes || []).length, 0)} lượt bình chọn
                  </div>
                </div>
              ) : (
                <FormattedText content={message.content} participants={participants} nicknames={selectedConvo.nicknames} isOwn={message.isOwn} />
              )}

              {message.expiresIn && !message.isRecalled && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px] mt-1 font-medium",
                  message.isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  <Timer className="size-3" />
                  {message.expiresAt ? formatTimeLeft(timeLeft) : formatTimeLeft(message.expiresIn)}
                </div>
              )}
            </Card>

            <Dialog open={showViewOnceModal} onOpenChange={(open) => {
              if (!open) setShowViewOnceModal(false);
            }}>
              <DialogContent className="max-w-2xl bg-black border-none p-1" showCloseButton={false}>
                <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                  {message.audioUrl ? (
                     <VoiceMessagePlayer src={message.audioUrl} />
                  ) : message.imgUrl ? (
                     <img src={message.imgUrl} alt="View once" className="max-w-full max-h-[80vh] object-contain rounded-md" />
                  ) : (
                     <div className="text-white text-lg p-6 text-center break-words">{message.content}</div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full"
                    onClick={() => setShowViewOnceModal(false)}
                  >
                    <EyeOff className="size-5" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Image Preview Lightbox Dialog */}
            <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
              <DialogContent className="max-w-4xl p-2 bg-black/95 border border-white/10 shadow-2xl flex flex-col items-center justify-center rounded-2xl overflow-hidden">
                <div className="relative w-full max-h-[85vh] flex items-center justify-center p-2">
                  {previewImage && (
                    <img 
                      src={previewImage} 
                      alt="Full Preview" 
                      className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" 
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Timestamp next to bubble */}
            <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap self-end mb-1 px-1">
               {formatMessageTime(new Date(message.createdAt))}
            </span>

            {/* Hover Actions */}
            {!message.isRecalled && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 rounded-full bg-background shadow-sm border text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={message.isOwn ? "end" : "start"} className="flex flex-col gap-1 p-1 min-w-0">
                    <div className="flex gap-1 mb-1">
                      {EMOJI_LIST.map((emoji) => (
                        <DropdownMenuItem
                          key={emoji}
                          onClick={() => reactToMessage(message._id, emoji)}
                          className="cursor-pointer text-xl p-2 hover:bg-accent focus:bg-accent rounded-md flex-1 text-center justify-center"
                        >
                          {emoji}
                        </DropdownMenuItem>
                      ))}
                    </div>
                    {canReply && (
                      <DropdownMenuItem
                        onClick={() => setReplyingToMessage(message)}
                        className="cursor-pointer font-medium flex items-center gap-2"
                      >
                        <Reply className="size-4" />
                        Trả lời
                      </DropdownMenuItem>
                    )}
                    {!message.isViewOnce && (
                      <DropdownMenuItem
                        onClick={() => setForwardingMessage(message)}
                        className="cursor-pointer font-medium flex items-center gap-2"
                      >
                        <Forward className="size-4" />
                        Chuyển tiếp
                      </DropdownMenuItem>
                    )}
                    {canPin && (
                      <DropdownMenuItem
                        onClick={() => pinMessage(message._id)}
                        className="cursor-pointer font-medium flex items-center gap-2"
                      >
                        {message.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                        {message.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
                      </DropdownMenuItem>
                    )}
                    {message.isOwn && (
                      <DropdownMenuItem
                        onClick={() => recallMessage(message._id)}
                        className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 font-medium flex items-center gap-2"
                      >
                        <Undo2 className="size-4" />
                        Thu hồi tin nhắn
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Reactions display */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className={cn("flex flex-wrap gap-1 mt-1 z-10", message.isOwn ? "justify-end" : "justify-start")}>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <div
                  key={emoji}
                  onClick={() => reactToMessage(message._id, emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium border cursor-pointer select-none transition-colors",
                    userReaction === emoji
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* seen/ delivered and read receipt avatars */}
          <div className="flex items-center justify-end gap-1 mt-1">
            {message.isOwn && message.viewedBy && message.viewedBy.length > 0 && (
              <div className="flex -space-x-1 justify-end">
                {message.viewedBy
                  .filter((vid) => vid !== user?._id) // don't show self
                  .filter((vid) => {
                    // Only show on the latest message this user has read
                    // messages array is newest-first
                    const latestReadMsg = messages.find(m => m.isOwn && m.viewedBy?.includes(vid));
                    return latestReadMsg?._id === message._id;
                  })
                  .map((vid) => {
                    const p = participants.find((part) => part._id?.toString() === vid);
                    if (!p) return null;
                    return (
                      <img
                        key={vid}
                        src={p.avatarUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                        alt={p.displayName}
                        className="size-3.5 rounded-full border border-background shadow-sm"
                        title={`Đã xem bởi ${p.displayName}`}
                      />
                    );
                  })}
              </div>
            )}
            
            {message.isOwn && message._id === selectedConvo.lastMessage?._id && lastMessageStatus !== "đã xem" && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 border font-medium lowercase",
                  lastMessageStatus === "đã nhận"
                    ? "bg-muted text-muted-foreground border-transparent"
                    : "bg-transparent text-muted-foreground/70 border-muted-foreground/30"
                )}
              >
                {lastMessageStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox xem ảnh phóng to */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-6xl w-auto max-h-[95vh] p-2 bg-black/85 backdrop-blur-xl border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden rounded-2xl">
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default MessageItem;