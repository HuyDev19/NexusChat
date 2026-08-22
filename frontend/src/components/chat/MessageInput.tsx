import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, Mic, Square, Loader2, BarChart2, Plus } from "lucide-react";
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
import { Dialog, DialogContent } from "../ui/dialog";

interface StagedImage {
  id: string;
  file: File;
  previewUrl: string;
}

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

  let isChannelMember = false;
  if (selectedConvo.type === "channel") {
    const userParticipant = selectedConvo.participants.find(p => p._id === user?._id);
    if (userParticipant && userParticipant.role === "member") {
      isChannelMember = true;
    }
  }

  const [value, setValue] = useState("");
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [previewingImageUrl, setPreviewingImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      stagedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems: StagedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now(),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setStagedImages(prev => [...prev, ...newItems]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeStagedImage = (id: string) => {
    setStagedImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(img => img.id !== id);
    });
  };

  const clearAllStagedImages = () => {
    stagedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setStagedImages([]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files: File[] = [];

    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const f = e.clipboardData.files[i];
        if (f.type.startsWith("image/")) files.push(f);
      }
    } else if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const newItems: StagedImage[] = files.map(file => ({
        id: Math.random().toString(36).substring(2, 9) + Date.now() + Math.random(),
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setStagedImages(prev => [...prev, ...newItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith("image/"));
    if (!files.length) return;

    const newItems: StagedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now(),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setStagedImages(prev => [...prev, ...newItems]);
  };

  const sendMessage = async (audioBlob?: Blob) => {
    const currImages = [...stagedImages];
    const hasImages = currImages.length > 0;

    if (!value.trim() && !audioBlob && !hasImages) return;
    const currValue = value.trim();

    // Clear text and staged images immediately for snappy UI
    setValue("");
    setDraft(selectedConvo._id, "");
    setStagedImages([]);
    inputRef.current?.focus();

    const participantIds = selectedConvo.participants.map(p => p._id);
    emitTypingEnd(selectedConvo._id, participantIds);

    const isMedia = Boolean(audioBlob || hasImages);

    try {
      if (isMedia) {
        setIsSendingMedia(true);
      }

      let audioUrl = undefined;
      if (audioBlob) {
        audioUrl = await uploadAudio(audioBlob);
      }

      let uploadedImgUrls: string[] = [];
      if (hasImages) {
        for (const item of currImages) {
          const imgUrl = await uploadImage(item.file);
          if (imgUrl) uploadedImgUrls.push(imgUrl);
        }
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

      if (uploadedImgUrls.length > 0) {
        // Gửi ảnh đầu tiên kèm nội dung text (nếu có)
        const firstImg = uploadedImgUrls[0];
        if (selectedConvo.type === "direct") {
          const participants = selectedConvo.participants || [];
          const otherUser = participants.filter((p) => p._id !== user._id)[0];
          await sendDirectMessage(otherUser._id, currValue, firstImg, audioUrl, expiresIn, isViewOnce, mentions, replyingToMessage?._id);
          // Nếu có thêm ảnh, gửi tiếp từng ảnh
          for (let i = 1; i < uploadedImgUrls.length; i++) {
            await sendDirectMessage(otherUser._id, "", uploadedImgUrls[i], undefined, expiresIn, isViewOnce, undefined, undefined);
          }
        } else {
          await sendGroupMessage(selectedConvo._id, currValue, firstImg, audioUrl, expiresIn, isViewOnce, undefined, mentions, replyingToMessage?._id);
          for (let i = 1; i < uploadedImgUrls.length; i++) {
            await sendGroupMessage(selectedConvo._id, "", uploadedImgUrls[i], undefined, expiresIn, isViewOnce, undefined, undefined);
          }
        }
      } else {
        // Gửi tin nhắn text hoặc audio bình thường
        if (selectedConvo.type === "direct") {
          const participants = selectedConvo.participants || [];
          const otherUser = participants.filter((p) => p._id !== user._id)[0];
          await sendDirectMessage(otherUser._id, currValue, undefined, audioUrl, expiresIn, isViewOnce, mentions, replyingToMessage?._id);
        } else {
          await sendGroupMessage(selectedConvo._id, currValue, undefined, audioUrl, expiresIn, isViewOnce, undefined, mentions, replyingToMessage?._id);
        }
      }

      if (replyingToMessage) setReplyingToMessage(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      setIsSendingMedia(false);
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

  const hasDraftOrMedia = Boolean(value.trim() || stagedImages.length > 0);

  if (isChannelMember) {
    return (
      <div className="w-full h-14 bg-muted/40 border-t border-border/40 flex items-center justify-center p-3 select-none">
        <div className="flex items-center gap-2 text-muted-foreground bg-muted px-4 py-2 rounded-xl text-xs font-medium border border-border/60">
          <Ban className="size-4" />
          <span>Chỉ quản trị viên mới có thể gửi tin nhắn vào kênh này.</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full bg-background border-t border-border/40 relative z-20 ${isDragging ? "bg-primary/5 border-primary" : ""
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 rounded-xl flex items-center justify-center pointer-events-none backdrop-blur-xs">
          <span className="text-sm font-semibold text-primary">Thả ảnh vào đây để đính kèm</span>
        </div>
      )}

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

      {/* Staged Images Preview matching composer layout */}
      {stagedImages.length > 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-semibold text-foreground">{stagedImages.length} ảnh</span>
            <button
              type="button"
              onClick={clearAllStagedImages}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
            >
              Xoá tất cả
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto py-2 beautiful-scrollbar">
            {stagedImages.map((img) => (
              <div
                key={img.id}
                onClick={() => setPreviewingImageUrl(img.previewUrl)}
                className="relative group size-16 sm:size-20 rounded-xl overflow-hidden border border-border/60 bg-background shrink-0 shadow-sm cursor-pointer hover:opacity-90 hover:scale-[1.03] transition-all"
                title="Bấm để xem ảnh lớn"
              >
                <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStagedImage(img.id);
                  }}
                  className="absolute top-1 right-1 size-5 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-md cursor-pointer z-10"
                  title="Xoá ảnh này"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="size-16 sm:size-20 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-all shrink-0 cursor-pointer"
              title="Thêm ảnh"
            >
              <Plus className="size-6" />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        {!isRecording ? (
          <div className="flex items-center gap-1">
            <input
              type="file"
              accept="image/*"
              multiple
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
                onPaste={handlePaste}
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

        {!hasDraftOrMedia && !isRecording ? (
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
            disabled={isRecording || isSendingMedia || !hasDraftOrMedia}
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

      {/* Lightbox Modal for Staged Image */}
      <Dialog open={Boolean(previewingImageUrl)} onOpenChange={(open) => !open && setPreviewingImageUrl(null)}>
        <DialogContent className="max-w-3xl p-3 bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl flex flex-col items-center justify-center rounded-2xl overflow-hidden">
          <div className="relative w-full max-h-[80vh] flex items-center justify-center">
            {previewingImageUrl && (
              <img
                src={previewingImageUrl}
                alt="Preview staged"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageInput;