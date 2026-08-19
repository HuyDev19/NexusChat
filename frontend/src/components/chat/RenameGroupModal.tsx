import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Edit3 } from "lucide-react";
import { toast } from "sonner";

export default function RenameGroupModal({
  open,
  onOpenChange,
  conversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}) {
  const { updateGroupInfo } = useChatStore();
  const [renameVal, setRenameVal] = useState("");

  useEffect(() => {
    if (open) {
      setRenameVal(conversation?.group?.name || "");
    }
  }, [open, conversation?.group?.name]);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameVal.trim()) {
      toast.warning("Vui lòng nhập tên mới!");
      return;
    }
    if (conversation?._id) {
      try {
        await updateGroupInfo(conversation._id, renameVal.trim());
        toast.success("Đổi tên thành công!");
        onOpenChange(false);
      } catch (error) {
        toast.error("Không thể đổi tên");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-3xl">
        <DialogHeader className="border-b border-border/40 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Edit3 className="w-5 h-5 text-purple-400" />
            <span>Đổi tên Nhóm chat</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tên mới cho nhóm chat
            </Label>
            <Input
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              placeholder="Nhập tên mới..."
              className="h-10 rounded-xl bg-muted/40 text-xs focus:border-purple-500"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="h-9 rounded-xl text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium shadow-md shadow-purple-500/20"
            >
              Lưu tên mới
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
