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
    <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-3 bg-[#1e1f22]/90 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 rounded-full shadow-2xl border border-white/10 z-50 w-[95%] max-w-[400px] sm:max-w-max overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Nút Mic */}
      <button
        onClick={toggleMic}
        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-full transition-all ${
          isMicrophoneEnabled ? "bg-[#313338] hover:bg-[#3f4147] text-white" : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title="Bật/Tắt Mic"
      >
        {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
      </button>

      {/* Nút Camera */}
      <button
        onClick={toggleCamera}
        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-full transition-all ${
          isCameraEnabled ? "bg-[#313338] hover:bg-[#3f4147] text-white" : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        title="Bật/Tắt Camera"
      >
        {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
      </button>

      {/* Nút Screen Share */}
      <button
        onClick={toggleScreenShare}
        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-full transition-all flex ${
          isScreenShareEnabled ? "bg-green-500 hover:bg-green-600 text-white" : "bg-[#313338] hover:bg-[#3f4147] text-white"
        }`}
        title="Chia sẻ màn hình"
      >
        {isScreenShareEnabled ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
      </button>

      {/* Dấu gạch chia */}
      <div className="w-px h-6 md:h-8 bg-white/20 mx-1 md:mx-2 shrink-0 block"></div>

      {/* Nút Lọc âm AI */}
      <button
        onClick={() => {
          if (!krisp.isNoiseFilterPending) {
            krisp.setNoiseFilterEnabled(!krisp.isNoiseFilterEnabled);
          }
        }}
        disabled={krisp.isNoiseFilterPending}
        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-full transition-all ${
          krisp.isNoiseFilterEnabled ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-[#313338] hover:bg-[#3f4147] text-white"
        } ${krisp.isNoiseFilterPending ? "opacity-50 cursor-not-allowed" : ""}`}
        title="Lọc tiếng ồn AI (Krisp)"
      >
        <Waves size={18} />
      </button>

      {/* Nút Mở/Đóng Chat */}
      <button
        onClick={onToggleChat}
        className={`w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-full transition-all ${
          isChatOpen ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-[#313338] hover:bg-[#3f4147] text-white"
        }`}
        title="Bật/Tắt Chat"
      >
        <MessageSquare size={18} />
      </button>

      {/* Nút Cài đặt thiết bị */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-full bg-[#313338] hover:bg-[#3f4147] text-white transition-all"
        title="Cài đặt thiết bị"
      >
        <Settings size={18} />
      </button>

      {/* Nút Kết thúc cuộc gọi */}
      <button
        onClick={onEndCall}
        className="w-14 h-10 md:w-16 md:h-12 shrink-0 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white transition-all ml-1 md:ml-2"
        title="Rời khỏi"
      >
        <PhoneOff size={20} />
      </button>

      <DeviceSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default CustomControlBar;
