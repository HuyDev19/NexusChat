import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Compass, Search, Users, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { useSearchParams } from "react-router";

interface ExploreChannelsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ExploreChannelsModal = ({ open, onOpenChange }: ExploreChannelsModalProps) => {
  const [search, setSearch] = useState("");
  const [channels, setChannels] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { explorePublicChannels, conversations, setActiveConversation } = useChatStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [linkInput, setLinkInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchChannels = async (q: string) => {
      setLoading(true);
      try {
        const data = await explorePublicChannels(q);
        if (isMounted) setChannels(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (open) {
      fetchChannels(search);
    }
    return () => { isMounted = false; };
  }, [open, search, explorePublicChannels]);

  const handleJoinOrPreview = (channelId: string) => {
    // Đóng modal Explore và mở Preview thông qua searchParams
    if (onOpenChange) onOpenChange(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("join", channelId);
    setSearchParams(newParams);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    let channelId = linkInput.trim();
    // Thử trích xuất ID nếu user nhập full link: http://.../chat?join=ID
    try {
      if (channelId.includes("join=")) {
        const url = new URL(channelId.startsWith("http") ? channelId : `http://${channelId}`);
        channelId = url.searchParams.get("join") || channelId;
      }
    } catch {
      // Bỏ qua lỗi URL
    }
    
    handleJoinOrPreview(channelId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[550px] p-6 rounded-3xl border-cyan-500/30 shadow-2xl bg-card">
        <DialogHeader className="border-b border-border/40 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Compass className="w-5 h-5 text-cyan-500" />
            <span>Khám Phá Kênh</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Ô nhập link */}
          <form onSubmit={handleLinkSubmit} className="flex gap-2">
            <Input
              placeholder="Nhập link hoặc mã kênh để tham gia..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="bg-secondary flex-1"
            />
            <Button type="submit" variant="secondary">
              Xem trước
            </Button>
          </form>

          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm kênh theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-muted/40 border-border/70 focus:border-cyan-500"
            />
          </div>

          {/* Danh sách kênh */}
          <div className="border border-border/40 rounded-2xl p-1.5 max-h-[350px] min-h-[200px] overflow-y-auto space-y-1.5 bg-muted/20">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : channels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs gap-2">
                <Compass className="w-8 h-8 opacity-40 text-cyan-500" />
                <span>Không tìm thấy kênh công khai nào.</span>
              </div>
            ) : (
              <>
                {!search.trim() && channels.length > 0 && (
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    Kênh nổi bật đề xuất cho bạn
                  </div>
                )}
                {(() => {
                  const displayChannels = search.trim()
                    ? channels
                    : [...channels].sort((a, b) => {
                        const aCount = a.followerCount || a.participants?.length || 0;
                        const bCount = b.followerCount || b.participants?.length || 0;
                        return bCount - aCount;
                      });

                  return displayChannels.map((channel) => {
                    // Kiểm tra xem đã tham gia chưa
                    const isMember = conversations.some(c => c._id === channel._id);

                return (
                  <div
                    key={channel._id}
                    className="flex flex-row items-center justify-between p-3 rounded-xl bg-card/60 hover:bg-muted/50 border border-transparent hover:border-border/60 transition-all gap-3"
                  >
                    <div 
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => handleJoinOrPreview(channel._id)}
                    >
                      <UserAvatar
                        type="chat"
                        name={channel.group?.name || "Kênh"}
                        avatarUrl={channel.group?.avatar}
                        className="w-12 h-12"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate hover:underline">{channel.group?.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{channel.followerCount || channel.participants?.length || 0} người theo dõi</span>
                        </div>
                        {channel.group?.description && (
                          <span className="text-[10px] text-muted-foreground truncate mt-1">
                            {channel.group.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (isMember) {
                          setActiveConversation(channel._id);
                          if (onOpenChange) onOpenChange(false);
                        } else {
                          handleJoinOrPreview(channel._id);
                        }
                      }}
                      variant={isMember ? "secondary" : "default"}
                      className={isMember ? "h-8 rounded-lg text-xs" : "h-8 rounded-lg text-xs bg-cyan-600 hover:bg-cyan-700 text-white"}
                    >
                      {isMember ? "Mở Kênh" : <><Plus className="w-3 h-3 mr-1" />Xem trước</>}
                    </Button>
                  </div>
                );
              })
            })()}
            </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExploreChannelsModal;
