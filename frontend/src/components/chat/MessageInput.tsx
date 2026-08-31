import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import CreatePollModal from "./CreatePollModal";
import ImageEditorModal, { type ImageEditResult } from "./ImageEditorModal";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useOfflineStore } from "@/stores/useOfflineStore";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  ImagePlus,
  Send,
  Mic,
  MicVocal,
  Square,
  Loader2,
  BarChart2,
  Plus,
  Paperclip,
  Timer,
  EyeOff,
  Ban,
  X,
  Reply,
  Pencil,
  FileText,
  Trash2,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";

interface StagedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const {
    sendDirectMessage,
    sendGroupMessage,
    uploadAudio,
    uploadImage,
    uploadFile,
    setDraft,
    replyingToMessage,
    setReplyingToMessage,
    editingMessage,
    setEditingMessage,
    editMessage
  } = useChatStore();

  const participants = selectedConvo?.participants || [];

  let isBlocked = false;
  if (selectedConvo?.type === "direct") {
    const otherUser = participants.find((p) => (p?._id || (p as any)?.userId?._id)?.toString() !== user?._id?.toString());
    const otherUserId = (otherUser?._id || (otherUser as any)?.userId?._id)?.toString();
    if (otherUserId && user?.blockedUsers?.includes(otherUserId)) {
      isBlocked = true;
    }
  }

  let isChannelMember = false;
  if (selectedConvo?.type === "channel") {
    const userParticipant = participants.find((p) => (p?._id || (p as any)?.userId?._id)?.toString() === user?._id?.toString());
    if (userParticipant && userParticipant.role === "member") {
      isChannelMember = true;
    }
  }

  const [value, setValue] = useState("");
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [previewingImageUrl, setPreviewingImageUrl] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content || "");
      inputRef.current?.focus();
    } else {
      const draft = useChatStore.getState().drafts[selectedConvo._id] || "";
      setValue(draft);
      inputRef.current?.focus();
    }
  }, [selectedConvo._id, editingMessage]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);

  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Voice to Text (Speech Recognition) Hook
  const {
    isListening: isSpeechListening,
    interimTranscript,
    startListening: startSpeechToText,
    stopListening: stopSpeechToText,
    isSupported: isSpeechSupported,
  } = useSpeechToText({
    onResult: (finalText) => {
      setValue((prev) => {
        const updated = prev ? `${prev} ${finalText}` : finalText;
        setDraft(selectedConvo._id, updated);
        return updated;
      });
    },
  });

  const { emitTypingStart, emitTypingEnd } = useSocketStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedConvo._id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        isCancelledRef.current = true;
        mediaRecorderRef.current.stop();
      }
      stagedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  if (!user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems: StagedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedImages((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File "${file.name}" quá lớn (trên 50MB)`);
        return false;
      }
      return true;
    });

    const newItems: StagedFile[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now(),
      file,
      name: file.name,
      size: file.size,
    }));

    setStagedFiles((prev) => [...prev, ...newItems]);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSaveEditedImage = (result: ImageEditResult) => {
    setStagedImages((prev) =>
      prev.map((img) => {
        if (img.id === editingImageId) {
          URL.revokeObjectURL(img.previewUrl);
          return {
            ...img,
            file: result.file,
            previewUrl: URL.createObjectURL(result.file),
          };
        }
        return img;
      })
    );
    setEditingImageId(null);
  };

  const removeStagedImage = (id: string) => {
    setStagedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const clearAllStagedMedia = () => {
    stagedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setStagedImages([]);
    setStagedFiles([]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const imgFiles: File[] = [];
    const docFiles: File[] = [];

    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const f = e.clipboardData.files[i];
        if (f.type.startsWith("image/")) imgFiles.push(f);
        else docFiles.push(f);
      }
    } else if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) imgFiles.push(f);
        }
      }
    }

    if (imgFiles.length > 0 || docFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();

      if (imgFiles.length > 0) {
        const newImages: StagedImage[] = imgFiles.map((file) => ({
          id: Math.random().toString(36).substring(2, 9) + Date.now() + Math.random(),
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        setStagedImages((prev) => [...prev, ...newImages]);
      }

      if (docFiles.length > 0) {
        const newDocs: StagedFile[] = docFiles.map((file) => ({
          id: Math.random().toString(36).substring(2, 9) + Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
        }));
        setStagedFiles((prev) => [...prev, ...newDocs]);
      }
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

    const allFiles = Array.from(e.dataTransfer.files || []);
    if (!allFiles.length) return;

    const imageFiles = allFiles.filter((f) => f.type.startsWith("image/"));
    const otherFiles = allFiles.filter((f) => !f.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      const newItems: StagedImage[] = imageFiles.map((file) => ({
        id: Math.random().toString(36).substring(2, 9) + Date.now(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setStagedImages((prev) => [...prev, ...newItems]);
    }

    if (otherFiles.length > 0) {
      const newDocs: StagedFile[] = otherFiles.map((file) => ({
        id: Math.random().toString(36).substring(2, 9) + Date.now(),
        file,
        name: file.name,
        size: file.size,
      }));
      setStagedFiles((prev) => [...prev, ...newDocs]);
    }
  };

  const sendMessage = async (audioBlob?: Blob) => {
    const currImages = [...stagedImages];
    const currFiles = [...stagedFiles];
    const hasImages = currImages.length > 0;
    const hasFiles = currFiles.length > 0;

    if (!value.trim() && !audioBlob && !hasImages && !hasFiles) return;
    const currValue = value.trim();

    if (editingMessage) {
      if (currValue !== editingMessage.content) {
        await editMessage(editingMessage._id, currValue);
      } else {
        setEditingMessage(null);
      }
      setValue("");
      setDraft(selectedConvo._id, "");
      inputRef.current?.focus();
      return;
    }

    // Clear text and staged items immediately for snappy UI
    setValue("");
    setDraft(selectedConvo._id, "");
    setStagedImages([]);
    setStagedFiles([]);
    inputRef.current?.focus();

    // Nếu đang mất kết nối mạng và gửi tin nhắn văn bản, đưa vào hàng đợi offline
    if (!navigator.onLine && currValue.trim() && !hasImages && !hasFiles && !audioBlob) {
      const tempId = `offline_${Date.now()}`;
      const convoParticipants = selectedConvo.participants || [];
      const otherUser = convoParticipants.find((p) => p._id !== user?._id);
      const offlineItem = {
        tempId,
        conversationId: selectedConvo._id,
        recipientId: selectedConvo.type === "direct" ? otherUser?._id : undefined,
        type: selectedConvo.type === "direct" ? ("direct" as const) : ("group" as const),
        content: currValue,
        replyTo: replyingToMessage?._id,
        createdAt: new Date().toISOString(),
      };
      useOfflineStore.getState().queueOfflineMessage(offlineItem);
      useChatStore.getState().addMessage({
        _id: tempId,
        conversationId: selectedConvo._id,
        senderId: user?._id || "",
        content: currValue,
        replyTo: replyingToMessage as any,
        createdAt: new Date().toISOString(),
        isOwn: true,
      } as any);
      if (replyingToMessage) setReplyingToMessage(null);
      return;
    }

    const participantIds = (selectedConvo.participants || []).map((p) => p._id);
    emitTypingEnd(selectedConvo._id, participantIds);

    const isMedia = Boolean(audioBlob || hasImages || hasFiles);

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
        const convoParticipants = selectedConvo.participants || [];
        const validIds: Set<string> = new Set();

        if (text.includes("@All") || text.includes("@Mọi người")) {
          convoParticipants.forEach((p) => {
            if (p._id !== user?._id) validIds.add(p._id);
          });
        }

        const sortedParticipants = [...convoParticipants].sort((a, b) => {
          const nameA = (selectedConvo.nicknames?.[a._id] || a.displayName || "").length;
          const nameB = (selectedConvo.nicknames?.[b._id] || b.displayName || "").length;
          return nameB - nameA;
        });

        sortedParticipants.forEach((p) => {
          const name = selectedConvo.nicknames?.[p._id] || p.displayName;
          if (name && text.includes(`@${name}`)) {
            if (p._id !== user?._id) validIds.add(p._id);
            text = text.replace(new RegExp(`@${name}`, "g"), "");
          }
        });

        return validIds.size > 0 ? Array.from(validIds) : undefined;
      };

      const mentions = parseMentions(currValue);

      // Gửi file đính kèm trước nếu có
      if (hasFiles) {
        for (const fileItem of currFiles) {
          const res = await uploadFile(fileItem.file);
          if (selectedConvo.type === "direct") {
            const convoParticipants = selectedConvo.participants || [];
            const otherUser = convoParticipants.find((p) => p._id !== user._id);
            if (otherUser) {
              await sendDirectMessage(
                otherUser._id,
                "",
                undefined,
                undefined,
                expiresIn,
                isViewOnce,
                undefined,
                replyingToMessage?._id,
                false,
                undefined,
                res.fileUrl,
                res.fileName,
                res.fileSize
              );
            }
          } else {
            await sendGroupMessage(
              selectedConvo._id,
              "",
              undefined,
              undefined,
              expiresIn,
              isViewOnce,
              undefined,
              undefined,
              replyingToMessage?._id,
              false,
              res.fileUrl,
              res.fileName,
              res.fileSize
            );
          }
        }
      }

      // Gửi ảnh hoặc tin nhắn text
      if (uploadedImgUrls.length > 0) {
        const firstImg = uploadedImgUrls[0];
        if (selectedConvo.type === "direct") {
          const convoParticipants = selectedConvo.participants || [];
          const otherUser = convoParticipants.find((p) => p._id !== user._id);
          if (otherUser) {
            await sendDirectMessage(
              otherUser._id,
              currValue,
              firstImg,
              audioUrl,
              expiresIn,
              isViewOnce,
              mentions,
              replyingToMessage?._id
            );
            for (let i = 1; i < uploadedImgUrls.length; i++) {
              await sendDirectMessage(
                otherUser._id,
                "",
                uploadedImgUrls[i],
                undefined,
                expiresIn,
                isViewOnce,
                undefined,
                undefined
              );
            }
          }
        } else {
          await sendGroupMessage(
            selectedConvo._id,
            currValue,
            firstImg,
            audioUrl,
            expiresIn,
            isViewOnce,
            undefined,
            mentions,
            replyingToMessage?._id
          );
          for (let i = 1; i < uploadedImgUrls.length; i++) {
            await sendGroupMessage(
              selectedConvo._id,
              "",
              uploadedImgUrls[i],
              undefined,
              expiresIn,
              isViewOnce,
              undefined,
              undefined
            );
          }
        }
      } else if (currValue || audioBlob) {
        // Gửi tin nhắn text hoặc audio thông thường (khi không có ảnh)
        if (selectedConvo.type === "direct") {
          const convoParticipants = selectedConvo.participants || [];
          const otherUser = convoParticipants.find((p) => p._id !== user._id);
          if (otherUser) {
            await sendDirectMessage(
              otherUser._id,
              currValue,
              undefined,
              audioUrl,
              expiresIn,
              isViewOnce,
              mentions,
              replyingToMessage?._id
            );
          }
        } else {
          await sendGroupMessage(
            selectedConvo._id,
            currValue,
            undefined,
            audioUrl,
            expiresIn,
            isViewOnce,
            undefined,
            mentions,
            replyingToMessage?._id
          );
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
      isCancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (!isCancelledRef.current) {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          sendMessage(audioBlob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast.error("Không thể truy cập microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      toast.info("Đã hủy ghi âm");
    }
  };

  const getFilteredParticipants = () => {
    if (mentionQuery === null) return [];

    const showAll =
      "all".includes(mentionQuery) ||
      "mọi người".includes(mentionQuery) ||
      "moi nguoi".includes(mentionQuery);
    const allOption =
      showAll && selectedConvo.type === "group"
        ? [
            {
              _id: "ALL",
              username: "all",
              displayName: "Mọi người",
              isAllOption: true,
            } as any,
          ]
        : [];

    const showAI = "nexusai".includes(mentionQuery) || "ai".includes(mentionQuery);
    const aiOption = showAI
      ? [
          {
            _id: "000000000000000000000000",
            username: "NexusAI",
            displayName: "NexusAI",
            isAllOption: false,
            avatarUrl: "https://cdn-icons-png.flaticon.com/512/826/826963.png",
          } as any,
        ]
      : [];

    const isIncognito = selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive;
    const convoParticipants = selectedConvo?.participants || [];
    const queryLower = (mentionQuery || "").toLowerCase();
    const users = convoParticipants
      .filter((p) => {
        const pId = (p?._id || (p as any)?.userId?._id)?.toString();
        if (!pId || pId === user?._id?.toString()) return false;
        
        if (isIncognito) {
          const ghostName = "nguoi la".toLowerCase();
          return ghostName.includes(queryLower) || "người lạ".includes(queryLower);
        }
        
        const uName = (p?.username || "").toLowerCase();
        const dName = (p?.displayName || "").toLowerCase();
        const nName = (selectedConvo?.nicknames && selectedConvo.nicknames[pId] ? selectedConvo.nicknames[pId] : "").toLowerCase();
        return uName.includes(queryLower) || dName.includes(queryLower) || nName.includes(queryLower);
      })
      .map(p => {
        if (isIncognito) {
          return {
            ...p,
            displayName: "Người Lạ",
            avatarUrl: "https://cdn-icons-png.flaticon.com/512/868/1236413.png",
            username: "nguoila"
          };
        }
        return p;
      })
      .slice(0, 5);

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
        setMentionIndex((prev) => (prev + 1) % filteredParticipants.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
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

    const participantIds = (selectedConvo.participants || []).map((p) => p._id);
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

  const hasDraftOrMedia = Boolean(value.trim() || stagedImages.length > 0 || stagedFiles.length > 0);

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
      className={`w-full bg-background border-t border-border/40 relative z-20 ${
        isDragging ? "bg-primary/5 border-primary" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 rounded-xl flex items-center justify-center pointer-events-none backdrop-blur-sm">
          <span className="text-sm font-semibold text-primary">Thả ảnh hoặc tệp vào đây để gửi</span>
        </div>
      )}

      {/* Replying Banner */}
      {replyingToMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply className="size-4 text-primary shrink-0" />
            <div className="flex flex-col text-sm truncate">
              <span className="font-semibold text-primary truncate">
                Đang trả lời{" "}
                {participants.find((p) => p._id === replyingToMessage.senderId)?.displayName ||
                  "người dùng"}
              </span>
              <span className="text-muted-foreground truncate">
                {replyingToMessage.audioUrl
                  ? "🎵 Tin nhắn thoại"
                  : replyingToMessage.imgUrl
                  ? "🖼️ Hình ảnh"
                  : replyingToMessage.content}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 cursor-pointer"
            onClick={() => setReplyingToMessage(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {editingMessage && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-t border-b border-primary/20">
          <div className="flex items-center gap-2 overflow-hidden">
            <Pencil className="size-4 text-primary shrink-0" />
            <div className="flex flex-col text-sm truncate">
              <span className="font-semibold text-primary truncate">
                Đang chỉnh sửa tin nhắn
              </span>
              <span className="text-muted-foreground truncate">
                {editingMessage.content}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-6 shrink-0 text-primary" onClick={() => setEditingMessage(null)}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Mode Indicators (View Once & Self-destruct timer) */}
      {(isViewOnce || expiresIn) && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border-b border-border/40 text-xs">
          {isViewOnce && (
            <span className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
              <EyeOff className="size-3" />
              Xem 1 lần
              <button
                type="button"
                onClick={() => setIsViewOnce(false)}
                className="hover:opacity-70 ml-1 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
          {expiresIn && (
            <span className="flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
              <Timer className="size-3" />
              Tự hủy:{" "}
              {expiresIn === 300
                ? "5 phút"
                : expiresIn === 3600
                ? "1 giờ"
                : expiresIn === 86400
                ? "24 giờ"
                : `${expiresIn}s`}
              <button
                type="button"
                onClick={() => setExpiresIn(undefined)}
                className="hover:opacity-70 ml-1 cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Staged Images Preview matching composer layout */}
      {stagedImages.length > 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-between py-1 text-xs">
            <span className="font-semibold text-foreground">{stagedImages.length} hình ảnh</span>
            <button
              type="button"
              onClick={clearAllStagedMedia}
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
                <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStagedImage(img.id);
                    }}
                    className="size-5 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-md cursor-pointer"
                    title="Xoá ảnh này"
                  >
                    <X className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImageId(img.id);
                    }}
                    className="size-5 bg-primary/90 hover:bg-primary text-white rounded-full flex items-center justify-center transition-colors shadow-md cursor-pointer"
                    title="Chỉnh sửa ảnh"
                  >
                    <Pencil className="size-2.5" />
                  </button>
                </div>
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

      {/* Staged Document Files */}
      {stagedFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-border/40 bg-muted/10 flex flex-wrap gap-2">
          {stagedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 bg-background border border-border/60 rounded-xl px-3 py-1.5 shadow-xs text-xs"
            >
              <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col max-w-[140px] truncate">
                <span className="font-medium text-foreground truncate">{file.name}</span>
                <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => removeStagedFile(file.id)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                title="Bỏ tệp này"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice to Text Listening Banner */}
      {isSpeechListening && (
        <div className="mx-3 mt-2 px-3.5 py-2 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-pink-500/15 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-2 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center size-5 shrink-0">
              <span className="absolute size-4 rounded-full bg-purple-500/40 animate-ping" />
              <span className="size-2.5 rounded-full bg-purple-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-purple-600 dark:text-purple-400">Đang nghe tiếng Việt...</span>
              <span className="text-[11px] text-muted-foreground italic truncate">
                {interimTranscript ? `"${interimTranscript}"` : 'Hãy nói... (hỗ trợ "dấu chấm", "xuống dòng", "trái tim")'}
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={stopSpeechToText}
            className="h-7 px-2.5 text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 rounded-lg shrink-0 shadow-xs cursor-pointer"
          >
            Xong
          </Button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 p-3 min-h-[56px]">
        {/* Hidden inputs */}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageSelect}
        />
        <input
          type="file"
          multiple
          className="hidden"
          ref={attachmentInputRef}
          onChange={handleFileSelect}
        />

        {!isRecording ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full hover:bg-primary/10 transition-smooth cursor-pointer"
                disabled={isSendingMedia}
                title="Tính năng mở rộng"
              >
                <Plus className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56 p-2 rounded-xl shadow-xl border-border/50">
              <DropdownMenuItem
                onSelect={() => fileInputRef.current?.click()}
                className="cursor-pointer gap-3 p-2 rounded-lg"
              >
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <ImagePlus className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Hình ảnh & Video</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => attachmentInputRef.current?.click()}
                className="cursor-pointer gap-3 p-2 rounded-lg"
              >
                <div className="bg-blue-500/10 p-2 rounded-full text-blue-500">
                  <Paperclip className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Tệp tài liệu</span>
                </div>
              </DropdownMenuItem>

                <DropdownMenuItem onClick={startRecording} className="cursor-pointer gap-3 p-2 rounded-lg">
                <div className="bg-orange-500/10 p-2 rounded-full text-orange-500">
                  <Mic className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Ghi âm</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setIsViewOnce(!isViewOnce)}
                className="cursor-pointer gap-3 p-2 rounded-lg"
              >
                <div
                  className={`p-2 rounded-full transition-colors ${
                    isViewOnce ? "bg-green-500 text-white" : "bg-green-500/10 text-green-500"
                  }`}
                >
                  <EyeOff className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Xem một lần</span>
                  <span className="text-[11px] text-muted-foreground">
                    {isViewOnce ? "Đang bật" : "Tắt"}
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-3 p-2 rounded-lg">
                  <div
                    className={`p-2 rounded-full transition-colors ${
                      expiresIn ? "bg-red-500 text-white" : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    <Timer className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Tin nhắn tự hủy</span>
                    <span className="text-[11px] text-muted-foreground">
                      {expiresIn === 300
                        ? "5 phút"
                        : expiresIn === 3600
                        ? "1 giờ"
                        : expiresIn === 86400
                        ? "24 giờ"
                        : "Tắt"}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-36 rounded-xl border-border/50">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setExpiresIn(undefined);
                        inputRef.current?.focus();
                      }}
                    >
                      Tắt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setExpiresIn(300);
                        inputRef.current?.focus();
                      }}
                    >
                      5 phút
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setExpiresIn(3600);
                        inputRef.current?.focus();
                      }}
                    >
                      1 giờ
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setExpiresIn(86400);
                        inputRef.current?.focus();
                      }}
                    >
                      24 giờ
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {selectedConvo.type === "group" && (
                <DropdownMenuItem
                  onClick={() => setShowPollModal(true)}
                  className="cursor-pointer gap-3 p-2 rounded-lg"
                >
                  <div className="bg-purple-500/10 p-2 rounded-full text-purple-500">
                    <BarChart2 className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Tạo bình chọn</span>
                  </div>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => useScheduleStore.getState().openScheduleModal(selectedConvo._id)}
                className="cursor-pointer gap-3 p-2 rounded-lg"
              >
                <div className="bg-purple-500/10 p-2 rounded-full text-purple-500">
                  <CalendarClock className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Lên lịch gửi tin nhắn</span>
                  <span className="text-[11px] text-muted-foreground">Hẹn giờ gửi tự động</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : editingMessage ? (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full hover:bg-primary/10 transition-smooth opacity-50"
            disabled
          >
            <Pencil className="size-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              onClick={cancelRecording}
              title="Hủy ghi âm"
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="shrink-0 animate-pulse cursor-pointer shadow-md"
              onClick={stopRecording}
              title="Dừng và gửi ghi âm"
            >
              <Square className="size-4 fill-current" />
            </Button>
          </div>
        )}

        <div className="flex-1 relative flex items-center">
          {isRecording ? (
            <div className="flex-1 h-9 flex items-center justify-between px-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/30">
              <div className="flex items-center gap-2">
                <span className="animate-pulse h-2.5 w-2.5 bg-red-500 rounded-full"></span>
                <span className="text-xs font-semibold">
                  Đang ghi âm... {Math.floor(recordingTime / 60)}:
                  {(recordingTime % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="animate-pulse text-xs opacity-75">Bấm nút đỏ để gửi</span>
              </div>
            </div>
          ) : (
            <>
              {mentionQuery !== null && filteredParticipants.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-background border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="py-1">
                    {filteredParticipants.map((p, index) => (
                      <div
                        key={p._id}
                        onClick={() =>
                          insertMention(
                            p.isAllOption
                              ? "All"
                              : selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive
                                ? "Người Lạ"
                                : (selectedConvo.nicknames?.[p._id] || p.displayName)
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                          index === mentionIndex ? "bg-primary/10" : "hover:bg-muted/50"
                        }`}
                        onMouseEnter={() => setMentionIndex(index)}
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0 overflow-hidden flex items-center justify-center">
                          {p.avatarUrl ? (
                            <img
                              src={p.avatarUrl}
                              alt={p.displayName}
                              className="w-full h-full object-cover"
                            />
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
                            {p.isAllOption
                              ? p.displayName
                              : selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive 
                                ? "Người Lạ" 
                                : (selectedConvo.nicknames?.[p._id] || p.displayName || "Unknown User")}
                          </span>
                          <span className="text-xs text-muted-foreground truncate leading-tight">
                            {p.isAllOption
                              ? "Nhắc tất cả mọi người trong nhóm"
                              : selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive 
                                ? "Ẩn danh"
                                : `Tên gốc: ${p.displayName || "Unknown"}`}
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
                className="pr-10 h-9 bg-white dark:bg-background border-border/50 focus:border-primary/50 transition-smooth resize-none rounded-xl"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
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
            </>
          )}
        </div>

        {/* Voice to Text Button */}
        {isSpeechSupported && !isRecording && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSpeechListening) {
                stopSpeechToText();
              } else {
                startSpeechToText();
              }
            }}
            className={cn(
              "shrink-0 rounded-xl transition-all cursor-pointer",
              isSpeechListening
                ? "bg-purple-600 text-white animate-pulse shadow-md shadow-purple-600/30 hover:bg-purple-700"
                : "text-muted-foreground hover:text-purple-600 hover:bg-purple-500/10"
            )}
            title={isSpeechListening ? "Dừng nhận diện giọng nói" : "Chuyển giọng nói thành văn bản (Voice to Text)"}
          >
            <MicVocal className="size-4" />
          </Button>
        )}

        <Button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => sendMessage()}
          className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105 shrink-0 rounded-xl cursor-pointer"
          disabled={isRecording || isSendingMedia || !hasDraftOrMedia}
        >
          {isSendingMedia ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : (
            <Send className="size-4 text-white" />
          )}
        </Button>

        <CreatePollModal
          open={showPollModal}
          onOpenChange={setShowPollModal}
          onCreatePoll={handleCreatePoll}
        />
      </div>

      {/* Lightbox Modal for Staged Image */}
      <Dialog
        open={Boolean(previewingImageUrl)}
        onOpenChange={(open) => !open && setPreviewingImageUrl(null)}
      >
        <DialogContent
          className="max-w-[95vw] w-auto max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-visible"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Xem trước hình ảnh</DialogTitle>
          <div className="relative inline-flex flex-col items-center justify-center max-w-[92vw] max-h-[90vh]">
            <div className="absolute top-3 right-3 z-50 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-xl">
              <button
                type="button"
                onClick={() => setPreviewingImageUrl(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="size-4" />
              </button>
            </div>
            {previewingImageUrl && (
              <img
                src={previewingImageUrl}
                alt="Preview Large"
                className="w-auto h-auto max-w-[90vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Built-in Fullscreen Image Editor Modal */}
      {editingImageId && (
        <ImageEditorModal
          isOpen={true}
          onClose={() => setEditingImageId(null)}
          image={{
            url: stagedImages.find((img) => img.id === editingImageId)?.previewUrl || "",
          }}
          onSave={handleSaveEditedImage}
        />
      )}
    </div>
  );
};

export default MessageInput;