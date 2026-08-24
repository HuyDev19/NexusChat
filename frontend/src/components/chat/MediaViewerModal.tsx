import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMediaViewerStore } from "@/stores/useMediaViewerStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Sparkles,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const MediaViewerModal = () => {
  const { isOpen, items, currentIndex, closeViewer, nextImage, prevImage, setIndex } = useMediaViewerStore();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIndex];

  // Reset zoom & rotation when changing image
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        closeViewer();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextImage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        prevImage();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === "-") {
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === "0") {
        setZoom(1);
        setRotation(0);
      }
    },
    [isOpen, closeViewer, nextImage, prevImage]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !currentItem) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus_media_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Đang tải ảnh xuống máy");
    } catch (e) {
      window.open(currentItem.url, "_blank");
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const formatTime = (date?: string | Date) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const isToday = new Date().toDateString() === d.toDateString();
      const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      if (isToday) return `${timeStr} Hôm nay`;
      return `${timeStr} ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeViewer()}>
      <DialogContent
        className={cn(
          "p-0 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden text-white transition-all duration-300",
          isFullscreen
            ? "fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none border-none z-[9999]"
            : "!w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] md:!max-w-[94vw] lg:!max-w-[92vw] xl:!max-w-[1440px] h-[92vh] max-h-[94vh] rounded-2xl"
        )}
        showCloseButton={false}
      >
        {/* ========================================================= */}
        {/* 1. TOP HEADER                                             */}
        {/* ========================================================= */}
        <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 select-none shrink-0">
          {/* Sender / Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-semibold text-sm truncate text-zinc-200">
              {currentItem.senderName || "Chi tiết hình ảnh"}
            </span>
            {items.length > 1 && (
              <span className="text-xs text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full font-medium">
                {currentIndex + 1} / {items.length}
              </span>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1.5">
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowThumbnails((prev) => !prev)}
                className={cn(
                  "size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors",
                  showThumbnails && "text-primary bg-primary/10"
                )}
                title={showThumbnails ? "Ẩn danh sách ảnh" : "Hiện danh sách ảnh"}
              >
                <Layers className="size-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFullscreen}
              className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Thu nhỏ cửa sổ" : "Mở rộng toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={closeViewer}
              className="size-8 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Đóng (Esc)"
            >
              <X className="size-4.5" />
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MAIN VIEWPORT & THUMBNAIL STRIP                        */}
        {/* ========================================================= */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Main Image Stage */}
          <div
            ref={containerRef}
            className="flex-1 relative flex items-center justify-center bg-black/90 overflow-hidden select-none p-4"
            onDoubleClick={() => setZoom((prev) => (prev > 1 ? 1 : 1.75))}
          >
            {/* Previous Button */}
            {items.length > 1 && currentIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white/90 hover:text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Ảnh trước (Mũi tên trái)"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            {/* Next Button */}
            {items.length > 1 && currentIndex < items.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 size-11 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white/90 hover:text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Ảnh tiếp theo (Mũi tên phải)"
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            {/* Active Image Canvas/Tag */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <img
                src={currentItem.url}
                alt={currentItem.content || "Media"}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)",
                }}
                className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-auto cursor-zoom-in"
                draggable={false}
              />
            </div>
          </div>

          {/* Right Thumbnails Strip (Zalo Style) */}
          {items.length > 1 && showThumbnails && (
            <div className="w-36 sm:w-44 bg-zinc-900/90 border-l border-white/10 p-2.5 overflow-y-auto beautiful-scrollbar flex flex-col gap-2.5 shrink-0 select-none">
              <div className="text-[11px] font-semibold text-zinc-400 px-1 py-0.5 uppercase tracking-wider">
                Gần đây ({items.length})
              </div>

              {items.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={item._id || idx}
                    onClick={() => setIndex(idx)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden bg-black/50 border transition-all duration-200 cursor-pointer group shrink-0",
                      isActive
                        ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-zinc-950 scale-[1.02] shadow-md shadow-primary/30"
                        : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                    )}
                  >
                    <img
                      src={item.url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. BOTTOM FOOTER BAR (Sender Info & Action Toolbar)       */}
        {/* ========================================================= */}
        <div className="h-14 px-4 border-t border-white/10 bg-zinc-900/90 flex items-center justify-between select-none shrink-0 gap-3">
          {/* Sender Profile */}
          <div className="flex items-center gap-2.5 min-w-0">
            {currentItem.senderAvatar ? (
              <Avatar className="size-8 rounded-full border border-white/20 shrink-0">
                <AvatarImage src={currentItem.senderAvatar} alt={currentItem.senderName || ""} />
                <AvatarFallback className="bg-primary text-xs font-bold text-white">
                  {currentItem.senderName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {currentItem.senderName || "Người dùng"}
              </span>
              {currentItem.createdAt && (
                <span className="text-[10px] text-zinc-400 truncate">
                  {formatTime(currentItem.createdAt)}
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
              className="size-8 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="size-4" />
            </Button>

            <span className="text-[11px] font-semibold text-zinc-400 w-10 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
              className="size-8 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Phóng to (+)"
            >
              <ZoomIn className="size-4" />
            </Button>

            {/* Rotate */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="size-8 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Xoay 90°"
            >
              <RotateCw className="size-4" />
            </Button>

            {/* Reset */}
            {(zoom !== 1 || rotation !== 0) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                }}
                className="size-8 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Khôi phục kích thước gốc (0)"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* Open in New Tab */}
            <a
              href={currentItem.url}
              target="_blank"
              rel="noreferrer"
              className="size-8 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Mở tab mới"
            >
              <ExternalLink className="size-4" />
            </a>

            {/* Download */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="size-8 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Tải ảnh về máy"
            >
              <Download className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewerModal;
