import { useOfflineStore } from "@/stores/useOfflineStore";
import { WifiOff, RefreshCw, CheckCircle2, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const OfflineBanner = () => {
  const { isOnline, isSyncing, outbox, syncOutbox } = useOfflineStore();

  if (isOnline && outbox.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full px-4 py-2 text-xs font-medium flex items-center justify-between transition-all duration-300 z-30 shadow-sm shrink-0 select-none",
        !isOnline
          ? "bg-amber-500/15 border-b border-amber-500/30 text-amber-600 dark:text-amber-400"
          : "bg-purple-500/15 border-b border-purple-500/30 text-purple-600 dark:text-purple-400"
      )}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <CloudOff className="size-4 shrink-0 animate-bounce" />
        ) : (
          <RefreshCw className={cn("size-4 shrink-0", isSyncing && "animate-spin")} />
        )}

        <span>
          {!isOnline
            ? `Chế độ ngoại tuyến • ${outbox.length > 0 ? `${outbox.length} tin nhắn chờ đồng bộ` : "Dữ liệu được lưu cục bộ"}`
            : isSyncing
            ? `Đang đồng bộ ${outbox.length} tin nhắn ngoại tuyến...`
            : `Đã kết nối lại mạng • ${outbox.length} tin nhắn đang chờ gửi`}
        </span>
      </div>

      {outbox.length > 0 && isOnline && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => syncOutbox()}
          disabled={isSyncing}
          className="h-6 px-2.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-md gap-1"
        >
          <RefreshCw className={cn("size-3", isSyncing && "animate-spin")} />
          <span>Đồng bộ ngay</span>
        </Button>
      )}
    </div>
  );
};

export default OfflineBanner;
