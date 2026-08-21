import { cn, getOfflineMinutes } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "busy";
  lastActiveAt?: string | Date | null;
  showMinutesBadge?: boolean;
}

const StatusBadge = ({ status, lastActiveAt, showMinutesBadge = false }: StatusBadgeProps) => {
  const offlineMinutes = status === "offline" ? getOfflineMinutes(lastActiveAt) : null;
  const showMinutes = Boolean(showMinutesBadge && offlineMinutes !== null && offlineMinutes >= 0 && offlineMinutes < 60);

  if (status === "offline" && showMinutes) {
    return (
      <div
        className="absolute -bottom-1 -right-1 px-1 min-w-[18px] h-4 bg-zinc-800 dark:bg-zinc-700 text-zinc-100 border-2 border-background rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs leading-none"
        title={`Đã offline ${offlineMinutes} phút trước`}
      >
        {offlineMinutes! < 1 ? "1p" : `${offlineMinutes}p`}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background",
        status === "online" && "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
        status === "offline" && "bg-slate-500",
        status === "busy" && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
      )}
    ></div>
  );
};

export default StatusBadge;