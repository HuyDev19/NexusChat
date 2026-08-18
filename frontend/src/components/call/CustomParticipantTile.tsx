import React from "react";
import { Track } from "livekit-client";
import { useIsSpeaking, useIsMuted, VideoTrack, AudioTrack } from "@livekit/components-react";
import { MicOff } from "lucide-react";

interface CustomParticipantTileProps {
  trackRef: any;
}

const CustomParticipantTile: React.FC<CustomParticipantTileProps> = ({ trackRef }) => {
  const { participant, source } = trackRef;
  
  const isSpeaking = useIsSpeaking(participant);
  // useIsMuted returns true if muted, so enabled is !muted
  // We need to check camera and mic separately by passing the source
  const isCameraEnabled = !useIsMuted(Track.Source.Camera, { participant });
  const isMicrophoneEnabled = !useIsMuted(Track.Source.Microphone, { participant });

  // Thường danh tính truyền qua LiveKit token nằm ở participant.identity hoặc participant.name
  const displayName = participant.name || participant.identity || "Unknown User";
  // AvatarURL nếu có thì thường gài trong metadata JSON
  let avatarUrl = "";
  try {
    if (participant.metadata) {
      const metadata = JSON.parse(participant.metadata);
      avatarUrl = metadata.avatarUrl || "";
    }
  } catch (e) {
    // ignore
  }

  const isScreenShare = source === Track.Source.ScreenShare;

  // Render Video hoặc Placeholder
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-[#1e1f22] overflow-hidden rounded-xl border-2 transition-colors duration-300 ${
        isSpeaking && !isScreenShare ? "border-green-500" : "border-transparent"
      }`}
    >
      {isScreenShare ? (
        <VideoTrack trackRef={trackRef} className="w-full h-full object-contain" />
      ) : isCameraEnabled ? (
        <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
      ) : (
        // Placeholder khi tắt camera
        <div className="flex flex-col items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className={`w-24 h-24 rounded-full object-cover mb-2 transition-all duration-300 ${
                isSpeaking ? "ring-4 ring-green-500 scale-105" : "ring-0"
              }`}
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white mb-2 transition-all duration-300 ${
                isSpeaking ? "ring-4 ring-green-500 scale-105" : "ring-0"
              }`}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Audio Track: Mọi user đều cần component này ẩn để phát tiếng */}
      <AudioTrack trackRef={trackRef} />

      {/* Thông tin tên và trạng thái Mic */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm z-10">
        <span className="truncate max-w-[120px]">{displayName}</span>
        {!isMicrophoneEnabled && !isScreenShare && <MicOff size={14} className="text-red-400" />}
      </div>
    </div>
  );
};

export default CustomParticipantTile;
