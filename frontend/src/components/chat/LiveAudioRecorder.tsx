import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Send, Trash2 } from "lucide-react";

interface LiveAudioRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

export default function LiveAudioRecorder({ onSend, onCancel }: LiveAudioRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(1);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: any;

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;

        // Visualizer audio level
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          try {
            const audioContext = new AudioContextClass();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkLevel = () => {
              analyser.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
              setAudioLevel(Math.max(0.2, Math.min(2.0, average / 40)));
              animationFrameRef.current = requestAnimationFrame(checkLevel);
            };
            checkLevel();
          } catch (e) {
            console.error("Lỗi AudioContext visualizer:", e);
          }
        }

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100);

        timer = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      })
      .catch((err) => {
        console.error("Lỗi micro:", err);
        onCancel();
      });

    return () => {
      clearInterval(timer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      onSend(audioBlob);
    };
    mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    onCancel();
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between px-3.5 py-1.5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/30 gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 shrink-0">
        <span className="animate-pulse h-2.5 w-2.5 bg-red-500 rounded-full"></span>
        <span className="text-xs font-mono font-semibold w-11">{formatTime(recordingTime)}</span>
      </div>

      {/* Live animated waveform visualizer */}
      <div className="flex-1 flex items-center justify-center gap-1 h-6 overflow-hidden">
        {[0.4, 0.8, 1.2, 0.6, 1.0, 1.4, 0.7, 1.1, 0.5, 0.9, 1.3, 0.8].map((factor, i) => (
          <div
            key={i}
            className="w-1 bg-red-500/80 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(4, Math.min(24, 6 * audioLevel * factor))}px`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="icon"
          className="rounded-full size-8 shrink-0 bg-red-500 hover:bg-red-600 text-white shadow-md transition-all hover:scale-105"
          onClick={handleStopAndSend}
          title="Gửi ghi âm"
        >
          <Send className="size-4 -ml-0.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full size-8 shrink-0 border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
          onClick={handleCancel}
          title="Hủy ghi âm"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
