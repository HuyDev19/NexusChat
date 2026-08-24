import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseSpeechToTextOptions {
  lang?: string;
  onResult?: (finalText: string) => void;
}

export const useSpeechToText = ({ lang = "vi-VN", onResult }: UseSpeechToTextOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const isListeningRef = useRef(false);

  // Always keep onResultRef updated without re-triggering useEffect
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        setInterimTranscript("");
      };

      recognition.onerror = (event: any) => {
        console.warn("[VoiceToText] Speech recognition event:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          toast.error("Vui lòng cấp quyền truy cập Microphone trong trình duyệt để nói!");
        } else if (event.error === "network") {
          toast.error("Lỗi kết nối mạng khi nhận diện giọng nói (Google Speech Engine).");
        } else if (event.error !== "no-speech" && event.error !== "aborted") {
          toast.error(`Lỗi nhận diện giọng nói: ${event.error}`);
        }
        setIsListening(false);
        isListeningRef.current = false;
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          let text = res[0]?.transcript || "";

          // Thay thế các lệnh nói thông dụng tiếng Việt
          text = text
            .replace(/\b(xuống dòng|xuống hàng)\b/gi, "\n")
            .replace(/\b(dấu chấm|chấm hết)\b/gi, ".")
            .replace(/\b(dấu phẩy)\b/gi, ",")
            .replace(/\b(dấu hỏi|chấm hỏi)\b/gi, "?")
            .replace(/\b(dấu chấm than|dấu than)\b/gi, "!")
            .replace(/\b(mặt cười)\b/gi, "😊")
            .replace(/\b(trái tim)\b/gi, "❤️");

          if (res.isFinal) {
            finalChunk += text;
          } else {
            currentInterim += text;
          }
        }

        if (finalChunk.trim()) {
          const trimmed = finalChunk.trim();
          setTranscript((prev) => (prev ? `${prev} ${trimmed}` : trimmed));
          if (onResultRef.current) {
            onResultRef.current(trimmed);
          }
        }

        setInterimTranscript(currentInterim);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("[VoiceToText] Failed to initialize SpeechRecognition:", err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [lang]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      toast.error("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Web Speech API). Hãy dùng Google Chrome hoặc Microsoft Edge!");
      return;
    }

    // Yêu cầu quyền Micro trước nếu cần
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr) {
      console.warn("[VoiceToText] Mic permission prompt error:", permErr);
      toast.error("Vui lòng cho phép truy cập Microphone trong trình duyệt để sử dụng!");
      return;
    }

    if (recognitionRef.current && !isListeningRef.current) {
      try {
        setTranscript("");
        setInterimTranscript("");
        recognitionRef.current.start();
        toast.info("🎙️ Đang lắng nghe... Hãy nói nội dung tin nhắn!");
      } catch (err: any) {
        console.warn("[VoiceToText] Start error:", err);
        // If already started, ignore error
        if (err.name !== "InvalidStateError") {
          toast.error("Không thể khởi động Microphone nhận diện giọng nói");
        }
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    isListeningRef.current = false;
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};
