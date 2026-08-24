import { cn, getOfflineMinutes } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "busy";
  lastActiveAt?: string | Date | null;
  showMinutesBadge?: boolean;
}

const StatusBadge = ({ status = "offline", lastActiveAt, showMinutesBadge = false }: StatusBadgeProps) => {
  if (!status || status === "offline") {
    if (!lastActiveAt || !showMinutesBadge) return null;

    const offlineMinutes = getOfflineMinutes(lastActiveAt);
    // Nếu không có thời gian hoặc đã offline hơn 24 giờ (1440 phút) -> không hiển thị gì cả
    if (offlineMinutes === null || offlineMinutes < 0 || offlineMinutes >= 24 * 60) {
      return null;
    }

    let badgeText = "";
    if (offlineMinutes < 60) {
      badgeText = offlineMinutes < 1 ? "1p" : `${offlineMinutes}p`;
    } else {
      const hours = Math.floor(offlineMinutes / 60);
      badgeText = `${hours}h`;
    }

    return (
      <div
        className="absolute -bottom-1 -right-1 px-1 min-w-[18px] h-4 bg-zinc-800 dark:bg-zinc-700 text-zinc-100 border-2 border-background rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs leading-none select-none pointer-events-none"
        title={`Hoạt động ${badgeText} trước`}
      >
        {badgeText}
      </div>
    );
  }

  // Khi online hoặc busy
  return (
    <div
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background",
        status === "online" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
        status === "busy" && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      )}
    />
  );
};

export default StatusBadge;