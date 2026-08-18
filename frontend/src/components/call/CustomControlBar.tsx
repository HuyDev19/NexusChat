import React from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, MessageSquare, PhoneOff, Settings, Waves } from "lucide-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import DeviceSettingsModal from "./DeviceSettingsModal";
import { useState } from "react";

interface CustomControlBarProps {
  onEndCall: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

const CustomControlBar: React.FC<CustomControlBarProps> = ({ onEndCall, onToggleChat, isChatOpen }) => {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const krisp = useKrispNoiseFilter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleMic = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCamera = () => {
    localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreenShare = () => {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1e1f22]/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 z-50">
      {/* Nút Mic */}
      <button
        onClick={toggleMic}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          isMicrophoneEnabled ? "bg-[#313338] hover:bg-[#3f4147] text-white" : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title="Bật/Tắt Mic"
      >
        {isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {/* Nút Camera */}
      <button
        onClick={toggleCamera}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          isCameraEnabled ? "bg-[#313338] hover:bg-[#3f4147] text-white" : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title="Bật/Tắt Camera"
      >
        {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      {/* Nút Screen Share */}
      <button
        onClick={toggleScreenShare}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all flex ${
          isScreenShareEnabled ? "bg-green-500 hover:bg-green-600 text-white" : "bg-[#313338] hover:bg-[#3f4147] text-white"
        }`}
        title="Chia sẻ màn hình"
      >
        {isScreenShareEnabled ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
      </button>

      {/* Dấu gạch chia */}
      <div className="w-px h-8 bg-white/20 mx-2 block"></div>

      {/* Nút Lọc âm AI */}
      <button
        onClick={() => {
          if (!krisp.isNoiseFilterPending) {
            krisp.setNoiseFilterEnabled(!krisp.isNoiseFilterEnabled);
          }
        }}
        disabled={krisp.isNoiseFilterPending}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          krisp.isNoiseFilterEnabled ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-[#313338] hover:bg-[#3f4147] text-white"
        } ${krisp.isNoiseFilterPending ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Lọc tiếng ồn AI (Krisp)"
      >
        <Waves size={20} />
      </button>

      {/* Nút Mở/Đóng Chat */}
      <button
        onClick={onToggleChat}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          isChatOpen ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-[#313338] hover:bg-[#3f4147] text-white"
        }`}
        title="Bật/Tắt Chat"
      >
        <MessageSquare size={20} />
      </button>

      {/* Nút Cài đặt thiết bị */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#313338] hover:bg-[#3f4147] text-white transition-all"
        title="Cài đặt thiết bị"
      >
        <Settings size={20} />
      </button>

      {/* Nút Kết thúc cuộc gọi */}
      <button
        onClick={onEndCall}
        className="w-16 h-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition-all ml-2"
        title="Rời khỏi"
      >
        <PhoneOff size={22} />
      </button>

      <DeviceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default CustomControlBar;
