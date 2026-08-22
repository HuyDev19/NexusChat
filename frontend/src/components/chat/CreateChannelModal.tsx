import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Megaphone, Globe, Lock } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";

interface CreateChannelModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CreateChannelModal = ({ open, onOpenChange }: CreateChannelModalProps) => {
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const { createChannel, convoLoading } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      if (!channelName.trim()) {
        toast.warning("Vui lòng nhập tên kênh");
        return;
      }

      await createChannel(channelName.trim(), description.trim(), isPublic);

      setChannelName("");
      setDescription("");
      setIsPublic(true);
      if (onOpenChange) onOpenChange(false);
    } catch (error) {
      console.error("Lỗi xảy ra khi tạo kênh:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[480px] p-6 rounded-3xl border-orange-500/30 shadow-2xl">
        <DialogHeader className="border-b border-border/40 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Megaphone className="w-5 h-5 text-orange-500" />
            <span>Tạo Kênh Phát Sóng Mới</span>
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-5 pt-2" onSubmit={handleSubmit}>
          {/* Tên kênh */}
          <div className="space-y-1.5">
            <Label htmlFor="channelName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tên kênh
            </Label>
            <Input
              id="channelName"
              placeholder="Ví dụ: Cập nhật tin tức Nexus..."
              className="h-10 rounded-xl bg-muted/40 border-border/70 text-xs focus:border-orange-500"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              required
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mô tả (Không bắt buộc)
            </Label>
            <Textarea
              id="description"
              placeholder="Kênh này dùng để..."
              className="resize-none rounded-xl bg-muted/40 border-border/70 text-xs focus:border-orange-500 h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Loại kênh */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Loại kênh
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setIsPublic(true)}
                className={cn(
                  "cursor-pointer flex flex-col gap-1 p-3 rounded-xl border transition-all",
                  isPublic
                    ? "bg-orange-500/10 border-orange-500 shadow-sm"
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Globe className={cn("w-4 h-4", isPublic ? "text-orange-500" : "text-muted-foreground")} />
                  <span className={isPublic ? "text-orange-500" : ""}>Công khai</span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Mọi người có thể tìm thấy kênh qua thanh tìm kiếm.
                </span>
              </div>

              <div
                onClick={() => setIsPublic(false)}
                className={cn(
                  "cursor-pointer flex flex-col gap-1 p-3 rounded-xl border transition-all",
                  !isPublic
                    ? "bg-orange-500/10 border-orange-500 shadow-sm"
                    : "bg-muted/30 border-transparent hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Lock className={cn("w-4 h-4", !isPublic ? "text-orange-500" : "text-muted-foreground")} />
                  <span className={!isPublic ? "text-orange-500" : ""}>Riêng tư</span>
                </div>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Chỉ những người có link chia sẻ mới có thể tham gia kênh.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="submit"
              disabled={convoLoading || !channelName.trim()}
              className="w-full h-10 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl text-xs gap-2 shadow-md shadow-orange-500/20"
            >
              <Megaphone className="w-4 h-4" />
              <span>Tạo Kênh</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelModal;
