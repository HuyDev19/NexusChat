import React, { useEffect, useRef } from "react";
import { useCallStore } from "@/stores/useCallStore";
import { Phone, PhoneOff, Video } from "lucide-react";
import UserAvatar from "../chat/UserAvatar";

// Sử dụng nhạc chuông tiêu chuẩn từ URL CDN công khai để test tiện lợi
const RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/1359/1359-84.wav";

const IncomingCallModal = () => {
  const { incomingCall, acceptCall, declineCall } = useCallStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (incomingCall) {
      // 1. Yêu cầu quyền Notification của trình duyệt khi có cuộc gọi đến
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // 2. Khởi tạo và phát nhạc chuông
      const audio = new Audio(RINGTONE_URL);
      audio.loop = true;
      audioRef.current = audio;

      audio.play().catch((err) => {
        console.warn("Trình duyệt chặn tự động phát âm thanh chuông cho đến khi có tương tác đầu tiên của người dùng:", err);
      });
    }

    return () => {
      // Dọn dẹp âm thanh khi cúp máy hoặc nhấc máy (Modal unmount)
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border flex flex-col items-center text-center space-y-6">
        
        {/* Ringing Avatar Effect */}
        <div className="relative flex items-center justify-center w-24 h-24">
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/20 animate-ping" />
          <span className="absolute inline-flex h-[120%] w-[120%] rounded-full bg-primary/10 animate-pulse" />
          <div className="relative z-10">
            <UserAvatar
              name={incomingCall.callerName}
              avatarUrl={incomingCall.callerAvatar}
              type="sidebar"
            />
          </div>
        </div>

        {/* Info */}
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {incomingCall.callerName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Đang gọi {incomingCall.isVideo ? "video" : "thoại"} cho bạn...
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-8 justify-center w-full">
          {/* Decline Button */}
          <button
            onClick={declineCall}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="p-4 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:bg-destructive/90 hover:scale-105 active:scale-95 transition-all duration-200">
              <PhoneOff size={24} />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Từ chối
            </span>
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="p-4 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all duration-200">
              {incomingCall.isVideo ? <Video size={24} /> : <Phone size={24} />}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              Nhấc máy
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
