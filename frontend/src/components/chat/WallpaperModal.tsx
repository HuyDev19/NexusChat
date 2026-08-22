import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useChatStore } from "@/stores/useChatStore";
import { Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const THEMES = [
  { id: "default", name: "Mặc định", class: "bg-background" },
  { id: "gradient-blue", name: "Gradient Xanh", class: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" },
  { id: "gradient-pink", name: "Gradient Hồng", class: "bg-gradient-to-br from-pink-500/20 to-rose-500/20" },
  { id: "gradient-purple", name: "Gradient Tím", class: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20" },
  { id: "doodle", name: "Họa tiết Doodle", class: "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-primary/5" },
];

const WallpaperModal = ({
  open,
  onOpenChange,
  conversationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
}) => {
  const { updateWallpaper } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTheme = async (themeId: string) => {
    setIsLoading(true);
    await updateWallpaper(conversationId, themeId);
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh dưới 5MB");
      return;
    }

    setIsLoading(true);
    await updateWallpaper(conversationId, file);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tùy chỉnh hình nền</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-transparent hover:border-primary/50 transition-all flex flex-col items-center justify-center p-4 gap-2",
                  theme.class
                )}
              >
                <div className="w-full h-12 rounded-md shadow-sm border border-border/50 bg-background/50"></div>
                <span className="text-xs font-medium text-center">{theme.name}</span>
              </div>
            ))}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all flex flex-col items-center justify-center p-4 gap-2 bg-muted/30"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {isLoading ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <ImagePlus className="size-6 text-muted-foreground" />}
              <span className="text-xs font-medium text-center">Tải ảnh lên</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperModal;
