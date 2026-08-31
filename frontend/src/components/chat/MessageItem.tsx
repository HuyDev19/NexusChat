import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Play, Pause, Pin, PinOff, Timer, EyeOff, Eye, Undo2, MoreHorizontal, Reply, Forward, Languages, FileText, Download, Pencil, X, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAccountInfoModalStore } from "@/stores/useAccountInfoModalStore";
import { useMediaViewerStore, type MediaItem } from "@/stores/useMediaViewerStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ImageViewerModal from "./ImageViewerModal";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleSpeed = () => {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-1 w-48 lg:w-56 select-none", isOwn ? "text-primary-foreground" : "")}>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "shrink-0 size-8 flex items-center justify-center rounded-full transition-colors",
            isOwn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-primary/10 hover:bg-primary/20 text-primary"
          )}
        >
          {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current ml-0.5" />}
        </button>

        {/* Waveform / Progress bar */}
        <div className="flex-1 flex items-center relative py-1">
          <div className="w-full h-1.5 rounded-full bg-muted/60 relative overflow-hidden">
            <div
              className={cn("h-full transition-all duration-100", isOwn ? "bg-white" : "bg-primary")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={toggleSpeed}
          className={cn(
            "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors",
            isOwn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-primary/10 hover:bg-primary/20 text-primary"
          )}
        >
          {speed}x
        </button>
      </div>

      <div className="flex justify-between items-center text-[10px] px-1 opacity-80 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus?: "đã gửi" | "đã nhận" | "đã xem";
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  const { reactToMessage, pinMessage, recallMessage, markMediaAsViewed, voteOnPoll, setReplyingToMessage, setForwardingMessage, translateMessage, setEditingMessage } = useChatStore();
  const { user } = useAuthStore();
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
  const next = index > 0 ? messages[index - 1] : undefined;

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
    new Date(prev?.createdAt || 0).getTime() >
    300000; // 5 phút

  const senderIdStr = typeof message.senderId === "object" ? (message.senderId as any)?._id || String(message.senderId) : String(message.senderId);
  const prevSenderIdStr = prev?.senderId ? (typeof prev.senderId === "object" ? (prev.senderId as any)?._id || String(prev.senderId) : String(prev.senderId)) : undefined;
  const nextSenderIdStr = next?.senderId ? (typeof next.senderId === "object" ? (next.senderId as any)?._id || String(next.senderId) : String(next.senderId)) : undefined;

  const isGroupBreak = isShowTime || senderIdStr !== prevSenderIdStr;

  const isLastInGroup =
    !next ||
    senderIdStr !== nextSenderIdStr ||
    new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() > 600000; // 10 minutes

  const participants = selectedConvo?.participants || [];
  const participant = participants.find(
    (p: Participant) => p?._id?.toString() === senderIdStr
  );

  const isAI = senderIdStr === "000000000000000000000000";

  const isChannel = selectedConvo?.type === "channel";
  const currentUserParticipant = participants.find((p: Participant) => p?._id?.toString() === user?._id?.toString());
  const isChannelAdmin = isChannel && (currentUserParticipant?.role === "leader" || currentUserParticipant?.role === "deputy");
  const isIncognito = selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive;
  
  const canPin = (!isChannel || isChannelAdmin) && !message.isViewOnce && !isIncognito;
  const canReply = (!isChannel || isChannelAdmin) && !message.isViewOnce;

  const getDisplayName = (): string => {
    if (isAI) return "NexusAI";
    if (isIncognito && !message.isOwn) return "Người Lạ";
    if (!participant) return "Unknown";
    return (selectedConvo?.nicknames?.[participant._id] || participant.displayName || "Unknown");
  };

  const otherParticipant = participants.find(
    (p: Participant) => {
      const pId = p?._id?.toString() || (p as any)?.userId?._id?.toString() || (p as any)?.userId?.toString();
      return pId && pId !== user?._id?.toString();
    }
  );

  const getRecipientDisplayName = (): string => {
    if (!otherParticipant) return "bạn";
    const pId = otherParticipant._id || (otherParticipant as any)?.userId?._id || (otherParticipant as any)?.userId;
    return (
      (pId && selectedConvo?.nicknames?.[pId]) ||
      otherParticipant.displayName ||
      "bạn"
    );
  };

  const getAvatarUrl = (): string | undefined => {
    if (isAI) return "https://cdn-icons-png.flaticon.com/512/826/826963.png";
    if (isIncognito && !message.isOwn) return "https://cdn-icons-png.flaticon.com/512/868/1236413.png";
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
  const [showEditHistory, setShowEditHistory] = useState(false);

  const handleOpenImageGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedConvo?._id) return;
    const convoMessages = useChatStore.getState().messages[selectedConvo._id]?.items || [];
    const imageMessages = convoMessages.filter((m) => !!m.imgUrl && !m.isRecalled && !m.isViewOnce);

    if (imageMessages.length > 0) {
      const mediaItems: MediaItem[] = imageMessages.map((m) => {
        const sender = participants.find((p) => p?._id?.toString() === m.senderId?.toString());
        const senderName =
          selectedConvo?.nicknames?.[m.senderId] ||
          sender?.displayName ||
          (m.isOwn ? "Bạn" : "Người dùng");
        return {
          _id: m._id,
          url: m.imgUrl!,
          senderName,
          senderAvatar: sender?.avatarUrl || null,
          createdAt: m.createdAt,
          content: m.content || undefined,
          conversationId: selectedConvo._id,
        };
      });

      const targetIdx = mediaItems.findIndex((item) => item._id === message._id);
      useMediaViewerStore.getState().openViewer(mediaItems, targetIdx >= 0 ? targetIdx : 0);
    } else if (message.imgUrl) {
      useMediaViewerStore.getState().openSingle(
        message.imgUrl,
        "Hình ảnh",
        message.isOwn ? "Bạn" : participant?.displayName || "Người dùng",
        participant?.avatarUrl || null,
        message.createdAt
      );
    }
  };

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
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  };

  if (timeLeft === 0) return null;

  const hasViewed = message.viewedBy?.includes(user?._id || "");

  const handleOpenViewOnce = () => {
    if (!hasViewed && !message.isOwn) {
      markMediaAsViewed(message._id);
    }
    setShowViewOnceModal(true);
  };

  const isStoryReply = message.content?.startsWith("[STORY_REPLY] ");
  const isImageReply = !isStoryReply && !!message.replyTo?.imgUrl && !message.replyTo?.isViewOnce && !message.replyTo?.isRecalled;
  const actualContent = isStoryReply 
    ? message.content!.replace("[STORY_REPLY] ", "").replace(/^Đã trả lời tin( của bạn| của [^:]+)?: /i, "").trim() 
    : message.content;

  const replyImgUrl = isStoryReply ? message.imgUrl : undefined;
  const replyHeaderName = isStoryReply
    ? (message.isOwn ? "Bạn đã trả lời tin" : `${getDisplayName()} đã trả lời tin`)
    : "";

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
                className={cn(
                  "transition-opacity",
                  !isIncognito && "cursor-pointer hover:opacity-80"
                )}
                onClick={() => {
                  if (!isIncognito && !isAI && senderIdStr) {
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
              className={cn(
                "text-[11px] text-muted-foreground ml-1 mb-0.5",
                !isIncognito && "cursor-pointer hover:underline"
              )}
              onClick={() => {
                if (!isIncognito && !isAI && senderIdStr) {
                  useAccountInfoModalStore.getState().openAccountModal(senderIdStr);
                }
              }}
            >
              {getDisplayName()}
            </span>
          )}

          {message.replyTo && !isStoryReply && !message.isRecalled && (() => {
            const replySenderId = typeof message.replyTo?.senderId === "object"
              ? (message.replyTo.senderId as any)?._id || String(message.replyTo.senderId)
              : message.replyTo?.senderId
              ? String(message.replyTo.senderId)
              : undefined;

            const isReplyToOwn = replySenderId === user?._id;
            const replyParticipant = selectedConvo.participants.find((p) => {
              const pId = p._id || (p as any).userId?._id || (p as any).userId;
              return pId?.toString() === replySenderId;
            });
            const replySenderName = isReplyToOwn
              ? "Bạn"
              : replyParticipant?.displayName || "người dùng";
            const replySenderAvatar = !isReplyToOwn ? replyParticipant?.avatarUrl : undefined;

            if (isImageReply && message.replyTo?.imgUrl) {
              const replyHeaderText = isReplyToOwn ? "Bạn đã trả lời" : `${replySenderName} đã trả lời bạn`;
              return (
                <div className={cn("flex flex-col gap-1 mb-0 max-w-[200px]", message.isOwn ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-1.5 text-xs text-foreground/80 mb-0.5 ml-0.5">
                    {!isReplyToOwn && (
                      <UserAvatar
                        type="chat"
                        name={replySenderName}
                        avatarUrl={replySenderAvatar}
                        className="!size-4 !text-[8px] ring-1 ring-border/40"
                      />
                    )}
                    <Reply className="size-3 shrink-0 opacity-90" />
                    <span className="text-[11.5px] font-medium truncate">
                      {replyHeaderText}
                    </span>
                  </div>
                  <div 
                    className="relative overflow-hidden rounded-2xl max-w-[150px] sm:max-w-[180px] max-h-[140px] cursor-pointer shadow-xs border border-border/40 hover:opacity-95 hover:brightness-105 transition-all group/replyimg bg-muted/30 flex items-center justify-center shrink-0"
                    onClick={() => {
                      if (message.replyTo?._id) {
                        const el = document.querySelector(`.message-${message.replyTo._id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.classList.add("bg-primary/20", "transition-colors", "duration-500");
                          setTimeout(() => el.classList.remove("bg-primary/20"), 1500);
                          return;
                        }
                      }
                      if (message.replyTo?.imgUrl) {
                        useMediaViewerStore.getState().openSingle(
                          message.replyTo.imgUrl,
                          "Hình ảnh",
                          replySenderName,
                          replySenderAvatar || null,
                          message.replyTo.createdAt || message.createdAt
                        );
                      }
                    }}
                    title="Bấm để xem ảnh hoặc chuyển đến tin nhắn gốc"
                  >
                    <img 
                      src={message.replyTo.imgUrl} 
                      alt="Hình ảnh trả lời" 
                      className="w-auto h-auto max-w-full max-h-[140px] rounded-2xl object-cover" 
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                className="flex items-center justify-between gap-3 mb-1 px-3 py-1.5 bg-muted/40 rounded-xl border-l-2 border-primary cursor-pointer hover:bg-muted/60 transition-all max-w-full group/reply shadow-xs"
                onClick={() => {
                  const el = document.querySelector(`.message-${message.replyTo?._id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  el?.classList.add("bg-primary/20", "transition-colors", "duration-500");
                  setTimeout(() => el?.classList.remove("bg-primary/20"), 1500);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Reply className="size-3 text-primary shrink-0 group-hover/reply:translate-x-0.5 transition-transform" />
                  <div className="flex flex-col text-[11px] min-w-0">
                    <span className="font-semibold text-primary truncate">
                      {replySenderName}
                    </span>
                    <span className="text-muted-foreground truncate text-[11px]">
                      {message.replyTo.isViewOnce
                        ? "[Tin nhắn xem một lần]"
                        : message.replyTo.isRecalled
                        ? "Tin nhắn đã thu hồi"
                        : message.replyTo.audioUrl
                        ? "🎵 Tin nhắn thoại"
                        : message.replyTo.fileUrl
                        ? `📎 ${message.replyTo.fileName || "Tệp đính kèm"}`
                        : message.replyTo.content}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {isStoryReply && !message.isRecalled && (
            <div className={cn("flex flex-col gap-1 mb-0 max-w-[180px] sm:max-w-[200px]", message.isOwn ? "items-end" : "items-start")}>
              <div className="flex items-center gap-1.5 text-xs text-foreground/80 mb-0.5 ml-0.5">
                {!message.isOwn && (
                  <UserAvatar
                    type="chat"
                    name={getDisplayName()}
                    avatarUrl={getAvatarUrl()}
                    className="!size-5 !text-[9px] ring-1 ring-border/40"
                  />
                )}
                <Reply className="size-3.5 shrink-0 opacity-90" />
                <span className="text-[12px] font-medium truncate">{replyHeaderName}</span>
              </div>
              <div 
                className="relative overflow-hidden rounded-2xl w-40 sm:w-44 aspect-[3/4] cursor-pointer shadow-sm border border-border/40 hover:opacity-95 hover:brightness-105 transition-all group/storyimg bg-muted shrink-0"
                onClick={() => {
                  if (replyImgUrl) {
                    useMediaViewerStore.getState().openSingle(
                      replyImgUrl,
                      "Tin (Story)",
                      message.isOwn ? "Bạn" : getDisplayName(),
                      getAvatarUrl() || null,
                      message.createdAt
                    );
                  }
                }}
                title="Bấm để xem ảnh/tin"
              >
                {replyImgUrl?.match(/\.(mp4|webm)$/i) || replyImgUrl?.includes("video") ? (
                  <video src={replyImgUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={replyImgUrl} alt="Story" className="w-full h-full object-cover" />
                )}
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

          <div className={cn("relative flex items-center gap-2", message.isOwn ? "flex-row-reverse" : "flex-row", (isStoryReply || isImageReply) ? "z-10 -mt-5" : "")}>
            <Card
              onDoubleClick={() => !message.isRecalled && reactToMessage(message._id, '❤️')}
              className={cn(
                "p-3 relative select-none transition-all duration-300 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-[1px]",
                message.isOwn ? "chat-bubble-sent border-0 !bg-primary" : "chat-bubble-received !bg-card",
                message.isRecalled ? "bg-muted/50 border border-border" : "",
                isIncognito ? "select-none pointer-events-auto" : "",
                (isStoryReply || isImageReply) ? "rounded-[20px] px-3.5 py-2 shadow-md ring-2 ring-background opacity-100" : ""
              )}
              onCopy={(e) => {
                if (isIncognito) {
                  e.preventDefault();
                }
              }}
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
              ) : message.imgUrl && !isStoryReply ? (
                <div className="space-y-1.5">
                  <img
                    src={message.imgUrl}
                    alt="Image"
                    onClick={handleOpenImageGallery}
                    className="rounded-md max-w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-95 hover:brightness-105 transition-all shadow-xs"
                    title="Bấm để xem ảnh phóng to"
                  />
                  {actualContent && (
                    <div className="pt-0.5 flex flex-col">
                      <FormattedText content={message.translatedContent || actualContent} participants={participants} nicknames={selectedConvo.nicknames} isOwn={message.isOwn} />
                      {message.translatedContent && (
                        <span className="text-[10px] opacity-70 italic mt-0.5">(Đã dịch)</span>
                      )}
                    </div>
                  )}
                </div>
              ) : message.fileUrl ? (
                <div className="flex flex-col gap-2 min-w-[200px] max-w-[280px]">
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                    <div className="size-10 rounded-lg bg-primary/10 flex flex-shrink-0 items-center justify-center">
                      <FileText className="size-5 text-primary" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground" title={message.fileName || "Tệp đính kèm"}>
                        {message.fileName || "Tệp đính kèm"}
                      </span>
                      {message.fileSize && (
                        <span className="text-[10px] text-muted-foreground">
                          {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="size-8 rounded-full bg-primary/10 hover:bg-primary/20 flex flex-shrink-0 items-center justify-center transition-colors cursor-pointer"
                      title="Tải xuống"
                    >
                      <Download className="size-4 text-primary" />
                    </a>
                  </div>
                  {actualContent && (
                    <div className="pt-0.5 flex flex-col">
                      <FormattedText content={message.translatedContent || actualContent} participants={participants} nicknames={selectedConvo.nicknames} isOwn={message.isOwn} />
                      {message.translatedContent && (
                        <span className="text-[10px] opacity-70 italic mt-0.5">(Đã dịch)</span>
                      )}
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
              ) : message.sharedContact ? (
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-border/50">
                    <UserAvatar
                      name={message.sharedContact.displayName}
                      avatarUrl={message.sharedContact.avatarUrl}
                      type="chat"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground">
                        {message.sharedContact.displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        Danh thiếp liên hệ
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs py-1 h-8"
                    onClick={() => {
                      useAccountInfoModalStore.getState().openAccountModal(message.sharedContact!._id);
                    }}
                  >
                    Xem trang cá nhân
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {isStoryReply ? (
                    <div className="text-[13.5px] leading-relaxed">
                      <span className="font-normal">
                        {message.isOwn 
                          ? `Đã trả lời tin của ${getRecipientDisplayName()}: ` 
                          : "Đã trả lời tin của bạn: "}
                      </span>
                      <span className="font-medium">
                        <FormattedText
                          content={message.translatedContent || actualContent}
                          participants={participants}
                          nicknames={selectedConvo.nicknames}
                          isOwn={message.isOwn}
                        />
                      </span>
                    </div>
                  ) : (
                    <FormattedText content={message.translatedContent || actualContent} participants={participants} nicknames={selectedConvo.nicknames} isOwn={message.isOwn} />
                  )}
                  {message.translatedContent && (
                    <span className="text-[10px] opacity-70 italic mt-1">(Đã dịch)</span>
                  )}
                </div>
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
                <DialogTitle className="sr-only">Tin nhắn xem một lần</DialogTitle>
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
            {previewImage && (
              <ImageViewerModal
                initialImageId={message._id}
                images={messages.filter((m) => !!m.imgUrl)}
                participants={participants}
                onClose={() => setPreviewImage(null)}
              />
            )}
            {/* Timestamp next to bubble */}
            {isLastInGroup && (
              <div className="flex items-center gap-1 self-end mb-1 px-1">
                {message.isEdited && (
                  <span
                    className={cn(
                      "text-[10px] text-muted-foreground/60",
                      message.isOwn && "cursor-pointer hover:underline"
                    )}
                    onClick={() => {
                      if (message.isOwn) setShowEditHistory(true);
                    }}
                  >
                    (Đã chỉnh sửa)
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                  {formatMessageTime(new Date(message.createdAt))}
                </span>
              </div>
            )}

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
                    {message.content && !message.translatedContent && (
                      <DropdownMenuItem
                        onClick={() => translateMessage(selectedConvo._id, message._id)}
                        className="cursor-pointer font-medium flex items-center gap-2"
                      >
                        <Languages className="size-4" />
                        Dịch sang tiếng Việt
                      </DropdownMenuItem>
                    )}
                    {!message.isViewOnce && !isIncognito && (
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
                    {message.isOwn && !message.isViewOnce && !message.expiresIn && (
                      <DropdownMenuItem
                        onClick={() => setEditingMessage(message)}
                        className="cursor-pointer font-medium flex items-center gap-2"
                      >
                        <Pencil className="size-4" />
                        Chỉnh sửa tin nhắn
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
                    
                    const finalAvatar = isIncognito 
                          ? "https://cdn-icons-png.flaticon.com/512/868/1236413.png" 
                          : (p.avatarUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png");
                    const finalTitle = isIncognito
                          ? "Đã xem bởi Người Lạ"
                          : `Đã xem bởi ${p.displayName}`;
                          
                    return (
                      <img
                        key={vid}
                        src={finalAvatar}
                        alt={isIncognito ? "Người Lạ" : p.displayName}
                        className="size-3.5 rounded-full border border-background shadow-sm"
                        title={finalTitle}
                      />
                    );
                  })}
              </div>
            )}

            {message.isOwn && message._id === selectedConvo?.lastMessage?._id && lastMessageStatus !== "đã xem" && (
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
      {/* Lịch sử chỉnh sửa */}
      <Dialog open={showEditHistory} onOpenChange={setShowEditHistory}>
        <DialogContent className="max-w-md p-4">
          <DialogTitle className="font-semibold text-lg border-b pb-2 mb-3">Lịch sử chỉnh sửa</DialogTitle>
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto beautiful-scrollbar">
            {message.editHistory?.map((history, idx) => (
              <div key={idx} className="flex flex-col gap-1 p-2 bg-muted/30 rounded-lg">
                <span className="text-xs text-muted-foreground">
                  {formatMessageTime(new Date(history.editedAt))} - {new Date(history.editedAt).toLocaleDateString("vi-VN")}
                </span>
                <span className="text-sm">{history.content}</span>
              </div>
            ))}
            <div className="flex flex-col gap-1 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-xs text-primary/70">
                Hiện tại - Đã cập nhật
              </span>
              <span className="text-sm font-medium">{message.content}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageItem;
