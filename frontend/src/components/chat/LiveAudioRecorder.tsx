import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import { Button } from "../ui/button";
import { Send, Trash2, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveAudioRecorderProps {
  onSend: (blob: Blob) => void;
  onCancel: () => void;
}

export default function LiveAudioRecorder({ onSend, onCancel }: LiveAudioRecorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#ef4444",
      progressColor: "#ef4444",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 36,
      normalize: true,
    });
    waveSurferRef.current = ws;

    const record = ws.registerPlugin(RecordPlugin.create({
      scrollingWaveform: true,
      renderRecordedAudio: false,
    }));
    recordPluginRef.current = record;

    record.on("record-end", (blob) => {
      onSend(blob);
    });

    record.startRecording().then(() => {
      setIsRecording(true);
    }).catch((err) => {
      console.error("Lỗi ghi âm:", err);
      onCancel();
    });

    return () => {
      record.stopRecording();
      ws.destroy();
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStopAndSend = () => {
    if (recordPluginRef.current?.isRecording()) {
      recordPluginRef.current.stopRecording();
    }
  };

  const handleCancel = () => {
    if (recordPluginRef.current?.isRecording()) {
      // Temporarily remove listener so it doesn't trigger onSend
      recordPluginRef.current.unAll();
      recordPluginRef.current.stopRecording();
    }
    onCancel();
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between px-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/30 gap-3">
      <div className="flex items-center gap-2 shrink-0">
        <span className="animate-pulse h-2.5 w-2.5 bg-red-500 rounded-full"></span>
        <span className="text-xs font-semibold w-10">{formatTime(recordingTime)}</span>
      </div>
      
      <div className="flex-1 min-w-0 flex items-center overflow-hidden">
        <div ref={containerRef} className="w-full" />
      </div>

      <div className="flex gap-1.5 shrink-0 ml-2 py-1.5">
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
          className="rounded-full size-8 shrink-0 border-red-500/30 text-red-500 hover:bg-red-50 transition-all"
          onClick={handleCancel}
          title="Hủy ghi âm"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
