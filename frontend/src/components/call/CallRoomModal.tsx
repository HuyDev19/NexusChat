import React, { useState } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { LiveKitRoom, RoomAudioRenderer, useParticipants } from "@livekit/components-react";
import { Maximize2, Minimize2, PhoneOff } from "lucide-react";
import "@livekit/components-styles";
import { startRingtone, stopRingtone } from "../../utils/ringtone";
import { useEffect } from "react";

import CustomVideoGrid from "./CustomVideoGrid";
import CustomControlBar from "./CustomControlBar";
import ChatWindowBody from "../chat/ChatWindowBody";
import MessageInput from "../chat/MessageInput";

// Component con để phát nhạc chuông khi đang chờ người khác nghe máy
const OutgoingCallRinger = () => {
  const participants = useParticipants();
  
  useEffect(() => {
    // Nếu chỉ có 1 người (chính mình) trong phòng -> đang chờ máy
    if (participants.length === 1) {
      startRingtone();
    } else {
      stopRingtone();
    }
    
    return () => stopRingtone();
  }, [participants.length]);

  return null;
};

const CallRoomModal = () => {
  const { activeCall, endCall } = useCallStore();
  const { conversations } = useChatStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { user } = useAuthStore();

  if (!activeCall) return null;

  const selectedConvo = conversations.find((c) => c._id === activeCall.conversationId);

  // Tạo tên hiển thị cho cuộc gọi dựa trên loại nhóm hoặc tên người dùng
  let displayRoomName = activeCall.roomName;
  if (selectedConvo) {
    if (selectedConvo.type === 'group' || selectedConvo.type === 'community') {
      displayRoomName = selectedConvo.group?.name || "Cuộc gọi Nhóm";
    } else {
      const otherParticipant = selectedConvo.participants?.find((p) => p._id !== user?._id);
      const otherId = otherParticipant?._id;
      displayRoomName = (otherId && selectedConvo.nicknames?.[otherId]) || otherParticipant?.displayName || "Cuộc gọi";
    }
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMaximized
          ? "inset-0 md:inset-4"
          : isMinimized
          ? "bottom-4 right-4 w-72 h-28 shadow-lg rounded-2xl"
          : "inset-4 md:inset-12 lg:inset-20 shadow-2xl rounded-2xl"
      }`}
    >
      <div className={`bg-[#2b2d31] w-full h-full border border-black/20 overflow-hidden flex flex-col ${!isMaximized && "rounded-2xl"}`}>
        {/* Header */}
        <div className="bg-[#1e1f22] px-4 py-3 flex items-center justify-between border-b border-black/20 text-gray-200 select-none">
          <span className="text-sm font-semibold truncate max-w-[200px]">
            {displayRoomName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Minimize */}
            <button
              onClick={() => {
                setIsMinimized(!isMinimized);
                setIsMaximized(false);
              }}
              className="p-1.5 rounded hover:bg-[#3f4147] text-gray-400 hover:text-white transition-colors"
              title={isMinimized ? "Phóng to panel" : "Thu nhỏ panel"}
            >
              <Minimize2 size={14} />
            </button>

            {/* Toggle Maximize */}
            {!isMinimized && (
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded hover:bg-[#3f4147] text-gray-400 hover:text-white transition-colors"
                title={isMaximized ? "Thu nhỏ về panel" : "Phóng to toàn màn hình"}
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Thân cửa sổ */}
        <div className="flex-1 min-h-0 relative flex bg-[#1e1f22]">
          <LiveKitRoom
            video={activeCall.isVideo}
            audio={true}
            token={activeCall.token}
            serverUrl={activeCall.serverUrl}
            onDisconnected={endCall}
            className="flex-1 w-full h-full relative"
          >
            {isMinimized ? (
              // UI Thu nhỏ
              <div className="absolute inset-0 flex items-center justify-between px-4 bg-[#2b2d31]">
                <span className="text-xs text-gray-300 animate-pulse font-medium">
                  Đang trong cuộc gọi...
                </span>
                <button
                  onClick={endCall}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <PhoneOff size={16} />
                </button>
              </div>
            ) : (
              // UI Mới
              <div className="absolute inset-0 flex">
                <div className="flex-1 relative min-w-0 flex flex-col bg-[#111214]">
                  {/* Video Grid */}
                  <div className="flex-1 min-h-0 p-2 pb-24 relative overflow-hidden">
                    <CustomVideoGrid />
                  </div>
                  
                  {/* Thanh điều khiển nổi */}
                  <CustomControlBar
                    onEndCall={endCall}
                    isChatOpen={isChatOpen}
                    onToggleChat={() => setIsChatOpen(!isChatOpen)}
                  />
                </div>

                {/* Khung Chat (Mini Chat) */}
                {isChatOpen && selectedConvo && (
                  <div className="absolute md:relative right-0 inset-y-0 w-full md:w-80 border-l border-white/5 bg-[#313338] flex flex-col z-40 transition-all duration-300">
                    <div className="p-3 border-b border-white/5 bg-[#2b2d31] font-semibold text-gray-200 text-sm">
                      Chat trong cuộc gọi
                    </div>
                    <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
                      {/* ChatWindowBody relies on activeConversationId globally, but works fine if the user doesn't navigate away */}
                      <ChatWindowBody />
                    </div>
                    <div className="bg-[#2b2d31]">
                      <MessageInput selectedConvo={selectedConvo} />
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Tự động phát âm thanh của mọi người trong phòng */}
            <RoomAudioRenderer />
            <OutgoingCallRinger />
          </LiveKitRoom>
        </div>
      </div>
    </div>
  );
};

export default CallRoomModal;
