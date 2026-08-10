import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";

const NicknameModal = ({
  open,
  onOpenChange,
  conversation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}) => {
  const { user } = useAuthStore();
  const { updateNickname } = useChatStore();
  
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setNicknames(conversation.nicknames || {});
    }
  }, [open, conversation.nicknames]);

  const handleSave = async (participantId: string) => {
    const newNickname = nicknames[participantId] || "";
    await updateNickname(conversation._id, participantId, newNickname);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi biệt danh</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {conversation.participants.map((p) => {
            const isMe = p._id === user?._id;
            const currentNickname = nicknames[p._id] || "";
            return (
              <div key={p._id} className="flex items-center gap-3">
                <UserAvatar 
                  type="sidebar" 
                  name={p.displayName} 
                  avatarUrl={p.avatarUrl} 
                />
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">
                    {p.displayName} {isMe ? "(Bạn)" : ""}
                  </div>
                  <Input 
                    value={currentNickname}
                    onChange={(e) => setNicknames(prev => ({ ...prev, [p._id]: e.target.value }))}
                    placeholder="Đặt biệt danh..."
                    className="h-8 text-sm"
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-5"
                  onClick={() => handleSave(p._id)}
                  disabled={currentNickname === (conversation.nicknames?.[p._id] || "")}
                >
                  Lưu
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NicknameModal;
