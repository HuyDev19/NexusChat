import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "../ui/dialog";
import { X, ChevronLeft, ChevronRight, Music, Trash2, Loader2, Heart, Send, Eye } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import UserAvatar from "./UserAvatar";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

const formatTimeAgo = (dateInput: string | Date) => {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSecs < 60) return "vừa xong";
    const diffInMins = Math.floor(diffInSecs / 60);
    if (diffInMins < 60) return `${diffInMins} phút trước`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  } catch {
    return "";
  }
};

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥"];

export default function StoryViewerModal({ open, onOpenChange, initialGroupIndex = 0 }: { open: boolean, onOpenChange: (open: boolean) => void, initialGroupIndex?: number }) {
  const { storyGroups, viewStory, deleteStory, reactStory } = useStoryStore();
  const { user } = useAuthStore();
  const { sendDirectMessage } = useChatStore();
  
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showViewers, setShowViewers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const replyTextRef = useRef("");
  const showViewersRef = useRef(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressStartRef = useRef<number>(Date.now());
  const isPausedRef = useRef(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Initialize when opened
  useEffect(() => {
    if (open) {
      setGroupIndex(Math.min(initialGroupIndex, storyGroups.length - 1));
      setStoryIndex(0);
      setReplyText("");
      replyTextRef.current = "";
      setShowViewers(false);
      showViewersRef.current = false;
    } else {
      stopAudio();
    }
  }, [open, initialGroupIndex, storyGroups.length]);

  // Cleanup music if currentStory becomes null/undefined (e.g. after delete)
  useEffect(() => {
    if (!currentStory) {
      stopAudio();
    }
  }, [currentStory]);

  // Story Navigation & Progress
  useEffect(() => {
    if (!open || !currentStory) return;

    setProgress(0);
    progressStartRef.current = Date.now();
    isPausedRef.current = false;
    
    // Mark as viewed
    if (user && !currentStory.viewers.some(v => v._id === user._id)) {
      viewStory(currentStory._id);
    }

    // Play music if available
    stopAudio();
    if (currentStory.music?.previewUrl) {
      audioRef.current = new Audio(currentStory.music.previewUrl);
      audioRef.current.play().catch(console.error);
    }

    let duration = 10000; // 10s for image default
    
    if (currentStory.mediaType === "video" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }

    const animateProgress = () => {
      // Dừng thanh chạy nếu đang mở Viewers list hoặc đang gõ chữ
      if (isPausedRef.current || showViewersRef.current || replyTextRef.current.length > 0) {
        progressStartRef.current += 16;
        progressTimerRef.current = setTimeout(animateProgress, 16);
        return;
      }
      
      let actualDuration = duration;
      if (currentStory.mediaType === "video" && videoRef.current?.duration) {
        actualDuration = videoRef.current.duration * 1000;
      }

      const elapsed = Date.now() - progressStartRef.current;
      const newProgress = (elapsed / actualDuration) * 100;

      if (newProgress >= 100) {
        setProgress(100);
        handleNextStory();
      } else {
        setProgress(newProgress);
        progressTimerRef.current = setTimeout(animateProgress, 16);
      }
    };

    progressTimerRef.current = setTimeout(animateProgress, 16);

    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, [groupIndex, storyIndex, open, currentStory]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleNextStory = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      onOpenChange(false);
    }
    setReplyText("");
    replyTextRef.current = "";
    setShowViewers(false);
    showViewersRef.current = false;
  };

  const handlePrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex(storyGroups[groupIndex - 1].stories.length - 1);
    } else {
      setProgress(0);
      progressStartRef.current = Date.now();
      if (videoRef.current) videoRef.current.currentTime = 0;
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
    setReplyText("");
    replyTextRef.current = "";
    setShowViewers(false);
    showViewersRef.current = false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".controls-ignore")) return;
    isPausedRef.current = true;
    if (videoRef.current) videoRef.current.pause();
  };

  const handlePointerUp = () => {
    isPausedRef.current = false;
    if (videoRef.current) videoRef.current.play().catch(console.error);
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    try {
      setIsDeleting(true);
      isPausedRef.current = true;
      await deleteStory(currentStory._id);
      
      if (currentGroup.stories.length <= 1) {
        if (groupIndex < storyGroups.length - 1) {
          setGroupIndex(prev => prev + 1);
          setStoryIndex(0);
        } else {
          onOpenChange(false);
        }
      } else {
        if (storyIndex >= currentGroup.stories.length - 1) {
          setStoryIndex(prev => prev - 1);
        } else {
          setStoryIndex(storyIndex);
          setProgress(0);
          progressStartRef.current = Date.now();
          isPausedRef.current = false;
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      isPausedRef.current = false;
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentStory || !user) return;

    try {
      setIsSending(true);
      await sendDirectMessage(
        currentGroup.user._id,
        `[STORY_REPLY] ${replyText}`,
        currentStory.mediaUrl, // imgUrl used for background/thumbnail
        undefined, // audioUrl
        undefined, // expiresIn
        false, // isViewOnce
        [], // mentions
        null, // replyTo
        false // isForwarded
      );
      toast.success("Đã gửi tin nhắn");
      setReplyText("");
      replyTextRef.current = "";
    } catch (error) {
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!currentStory) return;
    try {
      await reactStory(currentStory._id, emoji);
      toast.success(`Đã bày tỏ cảm xúc ${emoji}`);
    } catch (error) {
      toast.error("Không thể thả cảm xúc");
    }
  };

  if (!open || !currentStory) return null;

  const isMyStory = user && currentGroup.user._id === user._id;
  const otherViewers = currentStory.viewers?.filter((v: any) => v._id !== user?._id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-screen h-screen m-0 p-0 bg-black/95 border-none rounded-none flex items-center justify-center overflow-hidden z-[100]"
        showCloseButton={false}
      >
        <div className="relative w-full h-full sm:w-[400px] sm:h-[90%] sm:max-h-[850px] bg-black sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col group">
          
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3 px-2 w-full bg-gradient-to-b from-black/60 to-transparent">
            {currentGroup.stories.map((s, idx) => (
              <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all ease-linear"
                  style={{ 
                    width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header Info */}
          <div className="absolute top-6 left-0 right-0 z-20 px-3 flex justify-between items-start controls-ignore">
            <div className="flex items-center gap-2">
              <UserAvatar name={currentGroup.user.displayName} avatarUrl={currentGroup.user.avatarUrl} userId={currentGroup.user._id} type="sidebar" />
              <div>
                <p className="text-white font-medium text-sm drop-shadow-md">{currentGroup.user.displayName}</p>
                <p className="text-white/70 text-xs drop-shadow-md">
                  {formatTimeAgo(currentStory.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isMyStory && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  disabled={isDeleting}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-rose-500/80 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              )}
              <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Music Badge (if has music) */}
          {currentStory.music && (
            <div className="absolute top-[72px] left-3 z-20 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 max-w-[200px] border border-white/10 controls-ignore">
              <Music className="w-3.5 h-3.5 text-white" />
              <div className="overflow-hidden">
                <p className="text-white text-xs font-medium truncate whitespace-nowrap animate-marquee">
                  {currentStory.music.title} - {currentStory.music.artist}
                </p>
              </div>
            </div>
          )}

          {/* Media Content */}
          <div 
            className="w-full h-full relative"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Click zones */}
            <div className="absolute left-0 top-0 w-1/3 h-[80%] z-10" onClick={(e) => { e.stopPropagation(); handlePrevStory(); }} />
            <div className="absolute right-0 top-0 w-2/3 h-[80%] z-10" onClick={(e) => { e.stopPropagation(); handleNextStory(); }} />

            {/* Media */}
            {currentStory.mediaType === "image" ? (
              <img 
                src={currentStory.mediaUrl} 
                alt="Story" 
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <video 
                ref={videoRef}
                src={currentStory.mediaUrl}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted={false}
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
          </div>

          {/* Footer Controls */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 controls-ignore">
            {isMyStory ? (
              // Owner View: Show Viewers count & button to open list
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => { setShowViewers(true); showViewersRef.current = true; }}
                  className="flex items-center gap-2 bg-black/40 backdrop-blur-md hover:bg-black/60 px-4 py-2 rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  {otherViewers.length > 0 ? (
                    <div className="flex -space-x-2">
                      {otherViewers.slice(0, 3).map((v: any, i: number) => {
                        const initial = (v?.displayName || v?.username || "U").charAt(0).toUpperCase();
                        return (
                          <div key={v?._id || i} className="size-6 rounded-full border border-black/50 overflow-hidden bg-primary/40 flex items-center justify-center text-[10px] font-semibold text-white">
                            {v?.avatarUrl ? (
                              <img 
                                src={v.avatarUrl} 
                                alt={v.displayName || ""} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                  const parent = (e.currentTarget as HTMLElement).parentElement;
                                  if (parent) {
                                    parent.innerText = initial;
                                  }
                                }}
                              />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Eye className="size-4 text-white/80" />
                  )}
                  <span className="text-white font-medium text-sm">
                    {otherViewers.length} người xem
                  </span>
                </button>
              </div>
            ) : (
              // Viewer View: Reply Input & Reactions
              <div className="flex flex-col gap-3">
                <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="text-2xl hover:scale-125 hover:-translate-y-2 transition-transform drop-shadow-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleReply} className="flex gap-2 relative">
                  <Input 
                    type="text" 
                    placeholder="Trả lời tin này..." 
                    className="flex-1 bg-black/40 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 h-11 rounded-full px-4 focus-visible:ring-1 focus-visible:ring-white/50 pr-12"
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      replyTextRef.current = e.target.value;
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={!replyText.trim() || isSending}
                    className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center bg-white text-black rounded-full hover:bg-white/90 disabled:opacity-50 disabled:bg-white/50 transition-colors"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Viewers Sheet (Only for Owner) */}
          {isMyStory && (
            <div className={cn(
              "absolute bottom-0 left-0 w-full bg-background rounded-t-3xl z-40 transition-transform duration-300 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
              showViewers ? "translate-y-0 h-[60%]" : "translate-y-full h-[60%]"
            )}>
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="font-semibold">Người xem ({otherViewers.length})</h3>
                <button onClick={() => { setShowViewers(false); showViewersRef.current = false; }} className="p-1.5 hover:bg-muted rounded-full">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto beautiful-scrollbar p-2">
                {otherViewers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm opacity-60">
                    Chưa có ai xem tin
                  </div>
                ) : (
                  <div className="space-y-1">
                    {otherViewers.map((viewer: any) => {
                      const reaction = currentStory.reactions?.find(r => r.userId._id === viewer._id);
                      return (
                        <div key={viewer._id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={viewer.displayName} avatarUrl={viewer.avatarUrl} userId={viewer._id} type="sidebar" />
                            <span className="text-sm font-medium">{viewer.displayName}</span>
                          </div>
                          {reaction && (
                            <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-full text-lg shadow-sm border border-border/50">
                              {reaction.emoji}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
