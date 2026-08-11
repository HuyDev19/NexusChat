import React, { useState } from "react";
import { useCallStore } from "@/stores/useCallStore";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Maximize2, Minimize2, PhoneOff } from "lucide-react";
import "@livekit/components-styles";

const CallRoomModal = () => {
  const { activeCall, endCall } = useCallStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  if (!activeCall) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMaximized
          ? "inset-4 md:inset-8"
          : isMinimized
          ? "bottom-4 right-4 w-72 h-16"
          : "bottom-4 right-4 w-96 h-[450px] max-h-[80vh]"
      }`}
    >
      <div className="bg-card w-full h-full rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header điều khiển cửa sổ */}
        <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border text-card-foreground select-none">
          <span className="text-xs font-semibold truncate max-w-[150px]">
            Cuộc gọi: {activeCall.roomName.substring(0, 15)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle Minimize */}
            <button
              onClick={() => {
                setIsMinimized(!isMinimized);
                setIsMaximized(false);
              }}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title={isMinimized ? "Phóng to panel" : "Thu nhỏ panel"}
            >
              <Minimize2 size={14} />
            </button>

            {/* Toggle Maximize */}
            {!isMinimized && (
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                title={isMaximized ? "Thu nhỏ về panel" : "Phóng to toàn màn hình"}
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Thân cửa sổ cuộc gọi */}
        <div className="flex-1 min-h-0 bg-black relative">
          <LiveKitRoom
            video={activeCall.isVideo}
            audio={true}
            token={activeCall.token}
            serverUrl={activeCall.serverUrl}
            onDisconnected={endCall}
            data-lk-theme="default"
            className="w-full h-full flex flex-col justify-between"
          >
            {isMinimized ? (
              // UI Thu nhỏ đơn giản chỉ có nút cúp máy và báo hiệu tiếng
              <div className="absolute inset-0 flex items-center justify-between px-4 bg-muted/95">
                <span className="text-xs text-muted-foreground animate-pulse">
                  Đang trong cuộc gọi...
                </span>
                <button
                  onClick={endCall}
                  className="bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <PhoneOff size={16} />
                </button>
              </div>
            ) : (
              // UI Đầy đủ của LiveKit với video lưới và control bar
              <>
                <VideoConference />
                <RoomAudioRenderer />
              </>
            )}
          </LiveKitRoom>
        </div>
      </div>
    </div>
  );
};

export default CallRoomModal;
