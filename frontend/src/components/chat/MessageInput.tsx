import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, Mic, Square, Loader2, BarChart2 } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import CreatePollModal from "./CreatePollModal";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Timer, EyeOff, Ban } from "lucide-react";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const { sendDirectMessage, sendGroupMessage, uploadAudio, uploadImage } = useChatStore();
  
  let isBlocked = false;
  if (selectedConvo.type === "direct") {
    const participants = selectedConvo.participants || [];
    const otherUser = participants.find(p => p._id !== user?._id);
    if (otherUser && user?.blockedUsers?.includes(otherUser._id)) {
      isBlocked = true;
    }
  }
  const [value, setValue] = useState("");
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);

  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);

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
    const currValue = value;
    setValue("");

    try {
      setIsSendingMedia(true);
      let audioUrl = undefined;
      let imgUrl = undefined;
      
      if (audioBlob) {
        audioUrl = await uploadAudio(audioBlob);
      }
      
      if (imageFile) {
        imgUrl = await uploadImage(imageFile);
      }

      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants || [];
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, (!audioBlob && !imageFile) ? currValue : "", imgUrl, audioUrl, expiresIn, isViewOnce);
      } else {
        await sendGroupMessage(selectedConvo._id, (!audioBlob && !imageFile) ? currValue : "", imgUrl, audioUrl, expiresIn, isViewOnce);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    } finally {
      setIsSendingMedia(false);
      setIsViewOnce(false);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
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
    <div className="flex items-center gap-2 p-3 min-h-[56px] bg-background">
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
            <Input
              onKeyPress={handleKeyPress}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Soạn tin nhắn..."
              className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
              disabled={isSendingMedia}
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
                  <DropdownMenuItem onClick={() => setExpiresIn(undefined)}>Tắt</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpiresIn(300)}>5 phút</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpiresIn(3600)}>1 giờ</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpiresIn(86400)}>24 giờ</DropdownMenuItem>
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
                    onChange={(emoji: string) => setValue(`${value}${emoji}`)}
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
  );
};

export default MessageInput;