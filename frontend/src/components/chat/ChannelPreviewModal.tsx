import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import UserAvatar from "./UserAvatar";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { useChatStore } from "@/stores/useChatStore";
import { Loader2, UsersRound, X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router";

interface ChannelPreview {
  _id: string;
  name: string;
  avatar: string | null;
  description: string | null;
  followerCount: number;
}

interface ChannelPreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string | null;
}

const ChannelPreviewModal = ({ isOpen, onOpenChange, channelId }: ChannelPreviewModalProps) => {
  const [preview, setPreview] = useState<ChannelPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  
  const { conversations, fetchConversations } = useChatStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreview = async () => {
      if (!channelId || !isOpen) return;
      try {
        setLoading(true);
        const data = await chatService.getChannelPreview(channelId);
        setPreview(data);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Không thể tải thông tin kênh");
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [channelId, isOpen, onOpenChange]);

  const handleJoin = async () => {
    if (!channelId) return;
    try {
      setJoining(true);
      await chatService.joinChannel(channelId);
      toast.success("Tham gia kênh thành công!");
      await fetchConversations();
      onOpenChange(false);
      
      // Navigate to chat and clear search params if present
      if (searchParams.has("join")) {
        navigate("/chat");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tham gia kênh");
    } finally {
      setJoining(false);
    }
  };

  const isAlreadyMember = conversations.some(c => c._id === channelId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        <div className="relative">
          {/* Header Cover Background (Blurred avatar) */}
          <div className="h-32 w-full relative overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
            {preview?.avatar && (
              <img 
                src={preview.avatar} 
                alt="cover" 
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          <DialogHeader className="px-6 pt-0 pb-4 relative z-10 -mt-12 text-center flex flex-col items-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Đang tải thông tin kênh...</p>
              </div>
            ) : preview ? (
              <>
                <div className="p-1 bg-background rounded-full mb-3 shadow-xl">
                  <UserAvatar
                    type="chat"
                    name={preview.name || "Kênh"}
                    avatarUrl={preview.avatar || undefined}
                    className="size-24 text-3xl"
                  />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {preview.name || "Kênh không tên"}
                </DialogTitle>
                <DialogDescription className="text-center w-full max-w-sm mt-1.5 flex items-center justify-center gap-2">
                  <UsersRound className="size-4" />
                  <span className="font-medium text-foreground">{preview.followerCount}</span> người theo dõi
                </DialogDescription>
                
                {preview.description && (
                  <div className="mt-4 p-3 bg-secondary/50 rounded-lg text-sm text-center w-full">
                    {preview.description}
                  </div>
                )}
                
                <div className="w-full mt-6 space-y-3">
                  {isAlreadyMember ? (
                    <Button 
                      className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                      onClick={() => {
                        onOpenChange(false);
                        if (searchParams.has("join")) navigate("/chat");
                      }}
                    >
                      Đã tham gia (Mở kênh)
                    </Button>
                  ) : (
                    <Button 
                      className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 transition-opacity" 
                      onClick={handleJoin}
                      disabled={joining}
                    >
                      {joining ? (
                        <><Loader2 className="size-4 mr-2 animate-spin" /> Đang tham gia...</>
                      ) : (
                        "Tham gia kênh"
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8">
                <p className="text-muted-foreground">Không tìm thấy kênh</p>
              </div>
            )}
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChannelPreviewModal;
