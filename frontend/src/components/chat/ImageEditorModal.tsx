import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Paintbrush,
  Crop,
  Undo,
  RotateCcw as ResetIcon,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export interface ImageEditResult {
  file: File;
}

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: { kind?: string; url: string };
  onSave: (result: ImageEditResult) => void;
}

type TabType = "transform" | "filters" | "draw";

interface FilterOption {
  id: string;
  name: string;
  css: string;
}

const FILTERS: FilterOption[] = [
  { id: "none", name: "Gốc", css: "none" },
  { id: "grayscale", name: "Trắng đen", css: "grayscale(100%)" },
  { id: "sepia", name: "Cổ điển", css: "sepia(80%)" },
  { id: "bright", name: "Sáng", css: "brightness(120%) contrast(105%)" },
  { id: "contrast", name: "Tương phản", css: "contrast(140%)" },
  { id: "warm", name: "Ấm áp", css: "sepia(30%) saturate(140%)" },
  { id: "cool", name: "Tươi mát", css: "hue-rotate(180deg) saturate(110%)" },
  { id: "invert", name: "Đảo màu", css: "invert(100%)" },
];

const COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ffffff", // White
  "#000000", // Black
];

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  image,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("transform");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("none");

  // Drawing state
  const [brushColor, setBrushColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    if (!image.url || !isOpen) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    img.onload = () => {
      imgRef.current = img;
      resetEdits();
    };
  }, [image.url, isOpen]);

  const resetEdits = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setSelectedFilter("none");
    setDrawingHistory([]);
    renderCanvas(0, false, false, "none", true);
  };

  const renderCanvas = (
    rot = rotation,
    fH = flipH,
    fV = flipV,
    filterId = selectedFilter,
    clearDrawings = false
  ) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adjust canvas dimensions for rotation
    const isRotated90or270 = Math.abs(rot % 180) === 90;
    const width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
    const height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    ctx.save();

    // Apply Filter
    const filterObj = FILTERS.find((f) => f.id === filterId);
    ctx.filter = filterObj ? filterObj.css : "none";

    // Transform
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(fH ? -1 : 1, fV ? -1 : 1);

    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );

    ctx.restore();

    if (clearDrawings) {
      setDrawingHistory([ctx.getImageData(0, 0, width, height)]);
    }
  };

  useEffect(() => {
    if (imgRef.current) {
      renderCanvas(rotation, flipH, flipV, selectedFilter);
    }
  }, [rotation, flipH, flipV, selectedFilter]);

  // Drawing handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save current state for undo
    setDrawingHistory((prev) => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleUndo = () => {
    if (drawingHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = drawingHistory[drawingHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setDrawingHistory((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const editedFile = new File([blob], `edited_${Date.now()}.png`, {
            type: "image/png",
          });
          onSave({ file: editedFile });
        }
      },
      "image/png",
      0.95
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border border-border/60 shadow-2xl flex flex-col max-h-[90vh] rounded-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-5 text-primary" />
            Chỉnh sửa hình ảnh
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetEdits}
              className="gap-1.5 text-xs h-8 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              title="Đặt lại ảnh gốc"
            >
              <ResetIcon className="size-3.5" />
              Đặt lại
            </Button>
          </div>
        </DialogHeader>

        {/* Canvas Preview Viewport */}
        <div className="relative flex-1 bg-black/40 flex items-center justify-center p-4 min-h-[340px] max-h-[50vh] overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            className={`max-w-full max-h-full object-contain rounded-lg shadow-xl transition-transform duration-200 ${
              activeTab === "draw" ? "cursor-crosshair" : "cursor-default"
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        {/* Tool Tabs & Controls */}
        <div className="p-4 border-t border-border/40 bg-muted/20 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("transform")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === "transform"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              <Crop className="size-3.5" />
              Xoay & Lật
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("filters")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === "filters"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              <Sliders className="size-3.5" />
              Bộ lọc màu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("draw")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === "draw"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              <Paintbrush className="size-3.5" />
              Vẽ chú thích
            </button>
          </div>

          {/* Sub-panel content */}
          {activeTab === "transform" && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => (prev - 90) % 360)}
                className="gap-2 text-xs cursor-pointer rounded-xl"
              >
                <RotateCcw className="size-4" />
                Xoay trái 90°
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="gap-2 text-xs cursor-pointer rounded-xl"
              >
                <RotateCw className="size-4" />
                Xoay phải 90°
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipH((prev) => !prev)}
                className={`gap-2 text-xs cursor-pointer rounded-xl ${
                  flipH ? "border-primary text-primary bg-primary/10" : ""
                }`}
              >
                <FlipHorizontal className="size-4" />
                Lật ngang
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlipV((prev) => !prev)}
                className={`gap-2 text-xs cursor-pointer rounded-xl ${
                  flipV ? "border-primary text-primary bg-primary/10" : ""
                }`}
              >
                <FlipVertical className="size-4" />
                Lật dọc
              </Button>
            </div>
          )}

          {activeTab === "filters" && (
            <div className="flex items-center gap-3 overflow-x-auto py-2 beautiful-scrollbar px-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFilter(f.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-xs transition-all shrink-0 cursor-pointer ${
                    selectedFilter === f.id
                      ? "border-primary bg-primary/10 font-semibold text-primary shadow-sm"
                      : "border-border/60 hover:bg-muted/60 text-muted-foreground"
                  }`}
                >
                  <div
                    className="size-12 rounded-lg bg-cover bg-center border border-border/40 shadow-xs"
                    style={{
                      backgroundImage: `url(${image.url})`,
                      filter: f.css,
                    }}
                  />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "draw" && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1 px-4">
              {/* Color list */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Màu:</span>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrushColor(c)}
                    className={`size-6 rounded-full border-2 transition-transform cursor-pointer ${
                      brushColor === c
                        ? "scale-125 border-foreground shadow-md ring-2 ring-primary/40"
                        : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Brush size slider & undo */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Nét:</span>
                <input
                  type="range"
                  min="2"
                  max="24"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24 accent-primary cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleUndo}
                  disabled={drawingHistory.length === 0}
                  className="size-8 cursor-pointer rounded-lg"
                  title="Hoàn tác nét vẽ"
                >
                  <Undo className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border/40 flex items-center justify-end gap-2 bg-background">
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">
            <X className="size-4 mr-1" />
            Hủy bỏ
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:shadow-glow cursor-pointer"
          >
            <Check className="size-4 mr-1" />
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditorModal;
