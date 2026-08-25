import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, Layers, Maximize, Minus, Plus, RotateCw, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { Message } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { cn, formatMessageTime } from "@/lib/utils";

interface ImageViewerModalProps {
  initialImageId: string;
  images: Message[];
  onClose: () => void;
  participants: any[];
}

export default function ImageViewerModal({ initialImageId, images, onClose, participants }: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);

  // images from props might be newest first (descending). We want to find the current one.
  useEffect(() => {
    const idx = images.findIndex(m => m._id === initialImageId);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  }, [initialImageId, images]);

  useEffect(() => {
    // Reset zoom and rotation when image changes
    setZoom(1);
    setRotation(0);
  }, [currentIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, images]);

  const currentMsg = images[currentIndex];
  if (!currentMsg) return null;

  const sender = participants.find(p => p._id === currentMsg.senderId) || participants.find(p => p.userId?._id === currentMsg.senderId);
  const senderName = currentMsg.senderId === "000000000000000000000000" ? "NexusAI" : sender?.displayName || "Unknown";
  const senderAvatar = currentMsg.senderId === "000000000000000000000000" ? undefined : sender?.avatarUrl;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-[95vw] w-full h-[92vh] p-0 bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col rounded-xl overflow-hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Xem ảnh</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">{senderName}</span>
            <span className="text-white/60 text-sm bg-white/10 px-2 py-0.5 rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors" title="Hiện/ẩn Gần đây">
              <Layers className="size-5" />
            </button>
            <button onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen();
            }} className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors" title="Toàn màn hình">
              <Maximize className="size-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors" title="Đóng">
              <X className="size-6" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative w-full h-full pt-14 pb-16">
          
          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden h-full">
            {images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white z-40 transition-colors"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}

            <div className="w-full h-full flex items-center justify-center overflow-hidden p-2">
              <img
                src={currentMsg.imgUrl}
                alt="Preview"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: zoom === 1 ? 'transform 0.2s ease' : 'none'
                }}
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            </div>

            {images.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white z-40 transition-colors"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>

          {/* Right Sidebar - Gần đây */}
          {showSidebar && images.length > 0 && (
            <div className="w-80 h-full bg-[#111111] border-l border-white/10 flex flex-col flex-shrink-0 z-40 animate-in slide-in-from-right-10 duration-200">
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <span className="text-xs font-semibold text-white/70 tracking-wider">GẦN ĐÂY ({images.length})</span>
              </div>
              <div className="flex-1 overflow-y-auto beautiful-scrollbar p-3 space-y-3">
                {images.map((msg, idx) => (
                  <div 
                    key={msg._id} 
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 transition-all",
                      idx === currentIndex ? "border-primary" : "border-transparent hover:border-white/20"
                    )}
                  >
                    <img src={msg.imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      {msg.imgUrl && <div className="size-4 bg-white/20 backdrop-blur-md rounded-sm flex items-center justify-center"><div className="w-2 h-1.5 bg-white rounded-[1px]"/></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-3">
            <UserAvatar name={senderName} avatarUrl={senderAvatar} type="chat" />
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">{senderName}</span>
              <span className="text-white/50 text-xs">
                {formatMessageTime(new Date(currentMsg.createdAt))} {new Date(currentMsg.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mr-80">
            <div className="flex items-center bg-white/10 rounded-full px-2 py-1">
              <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                <Minus className="size-4" />
              </button>
              <span className="text-white text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(prev => Math.min(3, prev + 0.25))} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                <Plus className="size-4" />
              </button>
            </div>
            
            <button onClick={() => setRotation(prev => prev + 90)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" title="Xoay">
              <RotateCw className="size-4" />
            </button>
            
            <a 
              href={currentMsg.imgUrl} 
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" 
              title="Tải xuống"
            >
              <Download className="size-4" />
            </a>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
