import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, Mic, Square, Loader2, BarChart2 } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import CreatePollModal from "./CreatePollModal";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Timer, EyeOff, Ban, X, Reply } from "lucide-react";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadAudio, uploadImage, setDraft, replyingToMessage, setReplyingToMessage } = useChatStore();

  let isBlocked = false;
  if (selectedConvo.type === "direct") {
    const participants = selectedConvo.participants || [];
    const otherUser = participants.find(p => p._id !== user?._id);
    if (otherUser && user?.blockedUsers?.includes(otherUser._id)) {
      isBlocked = true;
    }
  }
  
  const [value, setValue] = useState("");

  useEffect(() => {
    const draft = useChatStore.getState().drafts[selectedConvo._id] || "";
    setValue(draft);
    inputRef.current?.focus();
  }, [selectedConvo._id]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);

  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const { emitTypingStart, emitTypingEnd } = useSocketStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedConvo._id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!user) return null;

  const sendMessage = async (audioBlob?: Blob, imageFile?: File) => {
    if (!value.trim() && !audioBlob && !imageFile) return;
    const currValue = value.trim();
    const isMedia = Boolean(audioBlob || imageFile);

    // Xóa text ngay và giữ con trỏ chuột nháy liên tục trong ô input
    if (!isMedia) {
      setValue("");
      setDraft(selectedConvo._id, "");
    }
    inputRef.current?.focus();

    const participantIds = selectedConvo.participants.map(p => p._id);
    emitTypingEnd(selectedConvo._id, participantIds);

    try {
      if (isMedia) {
        setIsSendingMedia(true);
      }

      let audioUrl = undefined;
      let imgUrl = undefined;

      if (audioBlob) {
        audioUrl = await uploadAudio(audioBlob);
      }

      if (imageFile) {
        imgUrl = await uploadImage(imageFile);
      }

      const parseMentions = (text: string) => {
        const participants = selectedConvo.participants || [];
        const validIds: Set<string> = new Set();

        if (text.includes("@All") || text.includes("@Mọi người")) {
          participants.forEach(p => {
            if (p._id !== user?._id) validIds.add(p._id);
          });
        }

        const sortedParticipants = [...participants].sort((a, b) => {
          const nameA = (selectedConvo.nicknames?.[a._id] || a.displayName || "").length;
          const nameB = (selectedConvo.nicknames?.[b._id] || b.displayName || "").length;
          return nameB - nameA;
        });

        sortedParticipants.forEach(p => {
          const name = selectedConvo.nicknames?.[p._id] || p.displayName;
          if (name && text.includes(`@${name}`)) {
            if (p._id !== user?._id) validIds.add(p._id);
            text = text.replace(new RegExp(`@${name}`, 'g'), '');
          }
        });

        return validIds.size > 0 ? Array.from(validIds) : undefined;
      };

      const mentions = parseMentions(currValue);

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants || [];
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, isMedia ? "" : currValue, imgUrl, audioUrl, expiresIn, isViewOnce, mentions, replyingToMessage?._id);
      } else {
        await sendGroupMessage(selectedConvo._id, isMedia ? "" : currValue, imgUrl, audioUrl, expiresIn, isViewOnce, undefined, mentions, replyingToMessage?._id);
      }
      if (replyingToMessage) setReplyingToMessage(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      if (isMedia) {
        setIsSendingMedia(false);
      }
      setIsViewOnce(false);
      inputRef.current?.focus();
    }
  };

  const handleCreatePoll = async (poll: any) => {
    try {
      setIsSendingMedia(true);
      if (selectedConvo.type === "group") {
        await sendGroupMessage(selectedConvo._id, "", undefined, undefined, undefined, false, poll);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tạo bình chọn");
    } finally {
      setIsSendingMedia(false);
      inputRef.current?.focus();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendMessage(undefined, file);
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        sendMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast.error("Không thể truy cập microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const getFilteredParticipants = () => {
    if (mentionQuery === null) return [];

    const showAll = "all".includes(mentionQuery) || "mọi người".includes(mentionQuery) || "moi nguoi".includes(mentionQuery);
    const allOption = showAll && selectedConvo.type === "group" ? [{
      _id: "ALL",
      username: "all",
      displayName: "Mọi người",
      isAllOption: true
    } as any] : [];

    const showAI = "nexusai".includes(mentionQuery) || "ai".includes(mentionQuery);
    const aiOption = showAI ? [{
      _id: "000000000000000000000000",
      username: "NexusAI",
      displayName: "NexusAI",
      isAllOption: false,
      avatarUrl: "https://cdn-icons-png.flaticon.com/512/826/826963.png"
    } as any] : [];

    const users = selectedConvo.participants.filter(
      p => p._id !== user?._id && (
        (p.username?.toLowerCase() || "").includes(mentionQuery) ||
        (p.displayName?.toLowerCase() || "").includes(mentionQuery) ||
        (selectedConvo.nicknames?.[p._id]?.toLowerCase() || "").includes(mentionQuery)
      )
    ).slice(0, 5); // Limit suggestions

    return [...aiOption, ...allOption, ...users];
  };
  const filteredParticipants = getFilteredParticipants();

  const insertMention = (name: string) => {
    if (inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart || 0;
      const textBeforeCursor = value.slice(0, cursorPosition);
      const textAfterCursor = value.slice(cursorPosition);

      const lastAtPos = textBeforeCursor.lastIndexOf("@");
      const beforeAt = value.slice(0, lastAtPos);

      const newValue = `${beforeAt}@${name} ${textAfterCursor}`;
      setValue(newValue);
      setDraft(selectedConvo._id, newValue);
      setMentionQuery(null);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursorPos = lastAtPos + name.length + 2; // +1 for @, +1 for space
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filteredParticipants.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredParticipants.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const p = filteredParticipants[mentionIndex];
        if (p.isAllOption) {
          insertMention("All");
        } else {
          insertMention(selectedConvo.nicknames?.[p._id] || p.displayName);
        }
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    setDraft(selectedConvo._id, val);

    const participantIds = selectedConvo.participants.map(p => p._id);
    emitTypingStart(selectedConvo._id, participantIds);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingEnd(selectedConvo._id, participantIds);
    }, 2000);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const lastWord = textBeforeCursor.split(/[\s\n]/).pop();

    if (lastWord && lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center p-3 min-h-[56px] bg-background border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <Ban className="size-4" />
          <span>Bạn đã chặn người dùng này. Bỏ chặn để gửi tin nhắn.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      {replyingToMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply className="size-4 text-primary shrink-0" />
            <div className="flex flex-col text-sm truncate">
              <span className="font-semibold text-primary truncate">
                Đang trả lời {selectedConvo.participants.find(p => p._id === replyingToMessage.senderId)?.displayName || "người dùng"}
              </span>
              <span className="text-muted-foreground truncate">
                {replyingToMessage.audioUrl ? "🎵 Tin nhắn thoại" : replyingToMessage.imgUrl ? "🖼️ Hình ảnh" : replyingToMessage.content}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => setReplyingToMessage(null)}>
            <X className="size-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        {!isRecording ? (
        <div className="flex items-center gap-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="hover:bg-primary/10 transition-smooth shrink-0"
            title="Gửi hình ảnh"
            disabled={isSendingMedia}
          >
            <ImagePlus className="size-5" />
          </Button>

          <Button
            variant={isViewOnce ? "default" : "ghost"}
            size="icon"
            onClick={() => setIsViewOnce(!isViewOnce)}
            className="hover:bg-primary/10 transition-smooth shrink-0"
            title="Chế độ xem một lần"
          >
            {isViewOnce ? <EyeOff className="size-4 text-white" /> : <EyeOff className="size-4" />}
          </Button>

          {selectedConvo.type === "group" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPollModal(true)}
              className="hover:bg-primary/10 transition-smooth shrink-0"
              title="Tạo bình chọn"
            >
              <BarChart2 className="size-5" />
            </Button>
          )}
        </div>
      ) : (
        <Button
          variant="destructive"
          size="icon"
          className="shrink-0 animate-pulse"
          onClick={stopRecording}
        >
          <Square className="size-4 fill-current" />
        </Button>
      )}

      <div className="flex-1 relative flex items-center">
        {isRecording ? (
          <div className="flex-1 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-md border border-red-200">
            <span className="animate-pulse mr-2 h-2 w-2 bg-red-500 rounded-full"></span>
            <span className="text-sm font-medium">
              Đang ghi âm... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
            </span>
          </div>
        ) : (
          <>
            {mentionQuery !== null && filteredParticipants.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-background border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="py-1">
                  {filteredParticipants.map((p, index) => (
                    <div
                      key={p._id}
                      onClick={() => insertMention(p.isAllOption ? "All" : (selectedConvo.nicknames?.[p._id] || p.displayName))}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${index === mentionIndex ? "bg-primary/10" : "hover:bg-muted/50"
                        }`}
                      onMouseEnter={() => setMentionIndex(index)}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0 overflow-hidden flex items-center justify-center">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
                        ) : p.isAllOption ? (
                          <span className="text-[10px] font-semibold text-primary">@</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-primary">
                            {p.displayName ? p.displayName.charAt(0) : "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-semibold truncate leading-tight">
                          {p.isAllOption ? p.displayName : (selectedConvo.nicknames?.[p._id] || p.displayName || "Unknown User")}
                        </span>
                        <span className="text-xs text-muted-foreground truncate leading-tight">
                          {p.isAllOption ? "Nhắc tất cả mọi người trong nhóm" : `Tên gốc: ${p.displayName || "Unknown"}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Input
              ref={inputRef}
              onKeyDown={handleKeyPress}
              value={value}
              onChange={handleInputChange}
              placeholder="Soạn tin nhắn..."
              className="pr-20 h-9 bg-white dark:bg-background border-border/50 focus:border-primary/50 transition-smooth resize-none"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`size-8 hover:bg-primary/10 transition-smooth ${expiresIn ? "text-red-500" : ""}`}
                    title="Tin nhắn tự hủy"
                  >
                    <Timer className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setExpiresIn(undefined); inputRef.current?.focus(); }}>Tắt</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setExpiresIn(300); inputRef.current?.focus(); }}>5 phút</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setExpiresIn(3600); inputRef.current?.focus(); }}>1 giờ</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setExpiresIn(86400); inputRef.current?.focus(); }}>24 giờ</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                asChild
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-primary/10 transition-smooth"
              >
                <div>
                  <EmojiPicker
                    onChange={(emoji: string) => {
                      setValue((prev) => {
                        const newVal = `${prev}${emoji}`;
                        setDraft(selectedConvo._id, newVal);
                        return newVal;
                      });
                      setTimeout(() => inputRef.current?.focus(), 10);
                    }}
                  />
                </div>
              </Button>
            </div>
          </>
        )}
      </div>

      {!value.trim() && !isRecording ? (
        <Button
          onClick={startRecording}
          variant="ghost"
          className="hover:bg-primary/10 transition-smooth shrink-0"
          size="icon"
          disabled={isSendingMedia}
        >
          {isSendingMedia ? <Loader2 className="size-5 animate-spin" /> : <Mic className="size-5" />}
        </Button>
      ) : (
        <Button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => sendMessage()}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 shrink-0"
          disabled={isRecording || isSendingMedia || !value.trim()}
        >
          {isSendingMedia ? <Loader2 className="size-4 animate-spin text-white" /> : <Send className="size-4 text-white" />}
        </Button>
      )}

      <CreatePollModal
        open={showPollModal}
        onOpenChange={setShowPollModal}
        onCreatePoll={handleCreatePoll}
      />
      </div>
    </div>
  );
};

export default MessageInput;