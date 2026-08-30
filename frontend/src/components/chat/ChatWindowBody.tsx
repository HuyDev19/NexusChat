import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import UserAvatar from "./UserAvatar";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Pin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { THEMES } from "./WallpaperModal";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ForwardMessageModal from "./ForwardMessageModal";
import { Ghost } from "lucide-react";

const ChatWindowBody = () => {
    const {
        activeConversationId,
        conversations,
        messages: allMessages,
        fetchMessages,
        typingUsers,
    } = useChatStore();
    const [lastMessageStatus, setLastMessageStatus] = useState<"đã gửi" | "đã nhận" | "đã xem">(
        "đã gửi"
    );
    const { onlineUsers } = useSocketStore();
    const { user } = useAuthStore();

    const messages = allMessages[activeConversationId!]?.items ?? [];
    const reversedMessages = [...messages].reverse();
    const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
    const selectedConvo = conversations.find((c) => c._id === activeConversationId);
    const key = `chat-scroll-${activeConversationId}`;

    const pinnedMessages = messages.filter(m => m.isPinned);
    const latestPinnedMessage = pinnedMessages[pinnedMessages.length - 1];

    const activeTypingUsers = (activeConversationId ? typingUsers[activeConversationId] : []) || [];

    // ref
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // seen status
    useEffect(() => {
        const lastMessage = selectedConvo?.lastMessage;
        if (!lastMessage) {
            return;
        }

        const seenBy = selectedConvo?.seenBy ?? [];

        if (seenBy.length > 0) {
            setLastMessageStatus("đã xem");
        } else {
            const otherParticipants = selectedConvo?.participants?.filter(p => (p?._id || (p as any)?.userId?._id)?.toString() !== user?._id?.toString()) || [];
            const isAnyOnline = otherParticipants.some(p => {
                const pId = ((p as any)?.userId?._id || p?._id)?.toString();
                return pId ? (onlineUsers || []).includes(pId) || p?.presenceStatus === "online" || (p as any)?.userId?.presenceStatus === "online" : false;
            });
            setLastMessageStatus(isAnyOnline ? "đã nhận" : "đã gửi");
        }
    }, [selectedConvo, onlineUsers, user]);

    // screen capture protection for incognito mode
    const [isBlurred, setIsBlurred] = useState(false);

    useEffect(() => {
        const isIncognito = selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive;
        const handleVisibilityChange = () => {
            if (document.hidden && isIncognito) setIsBlurred(true);
            else setIsBlurred(false);
        };
        const handleBlur = () => {
            if (isIncognito) setIsBlurred(true);
        };
        const handleFocus = () => setIsBlurred(false);
        
        const handleKeyUp = (e: KeyboardEvent) => {
            if (!isIncognito) return;
            if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && ["s", "S", "3", "4"].includes(e.key))) {
                toast.error("Phát hiện hành động chụp ảnh màn hình!");
                
                const user = useAuthStore.getState().user;
                const otherUser = selectedConvo?.participants?.find((p: any) => (p._id || p) !== user?._id);
                
                if (otherUser && activeConversationId) {
                    const recipientId = typeof otherUser === "string" ? otherUser : otherUser._id;
                    useChatStore.getState().sendDirectMessage(
                        recipientId as string, 
                        "📸 Người lạ đã chụp màn hình"
                    ).catch(() => {});
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [selectedConvo?.type, selectedConvo?.incognitoMode?.isActive, activeConversationId]);

    // kéo xuống dưới khi load convo
    useLayoutEffect(() => {
        if (!messagesEndRef.current) return;

        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [activeConversationId]);

    const fetchMoreMessages = async () => {
        if (!activeConversationId) {
            return;
        }

        try {
            await fetchMessages(activeConversationId);
        } catch (error) {
            console.error("Lỗi xảy ra khi fetch thêm tin", error);
        }
    };

    const handleScrollSave = () => {
        const container = containerRef.current;
        if (!container || !activeConversationId) {
            return;
        }

        sessionStorage.setItem(
            key,
            JSON.stringify({
                scrollTop: container.scrollTop,
                scrollHeight: container.scrollHeight,
            })
        );
    };

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const item = sessionStorage.getItem(key);

        if (item) {
            const { scrollTop } = JSON.parse(item);
            requestAnimationFrame(() => {
                container.scrollTop = scrollTop;
            });
        }
    }, [messages.length]);

    const scrollToMessage = (msgId: string) => {
        const container = containerRef.current;
        if (!container) return;
        const msgElements = container.getElementsByClassName(`message-${msgId}`);
        if (msgElements.length > 0) {
            msgElements[0].scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    if (!selectedConvo) {
        return <ChatWelcomeScreen />;
    }

    if (!messages?.length) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground ">
                Chưa có tin nhắn nào trong cuộc trò chuyện này.
            </div>
        );
    }

    const wallpaperStyle = selectedConvo.wallpaper && selectedConvo.wallpaper.startsWith("http")
        ? { backgroundImage: `url(${selectedConvo.wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {};

    const wallpaperClass = selectedConvo.wallpaper && !selectedConvo.wallpaper.startsWith("http") && selectedConvo.wallpaper !== "default"
        ? (THEMES.find(t => t.id === selectedConvo.wallpaper)?.class || "")
        : "";

    return (
        <div
            className={cn("bg-primary-foreground h-full flex flex-col overflow-hidden relative", wallpaperClass)}
            style={wallpaperStyle}
        >
            {/* Background Overlay if image */}
            {selectedConvo.wallpaper && selectedConvo.wallpaper.startsWith("http") && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0 pointer-events-none"></div>
            )}

            {isBlurred && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                    <Ghost className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-foreground">Chat Ẩn Danh Đang Bật</h3>
                    <p className="text-muted-foreground mt-2">Nội dung đã bị ẩn để bảo vệ quyền riêng tư.</p>
                </div>
            )}

            {pinnedMessages.length > 0 && (
                <div className="px-4 pt-3 pb-1 z-20">
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="bg-background/95 shadow-sm border px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-xl">
                                <div className="shrink-0 p-1.5 bg-primary/10 text-primary rounded-full">
                                    <Pin className="size-4" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="text-xs font-semibold text-primary">
                                        {pinnedMessages.length > 1 ? `${pinnedMessages.length} tin nhắn đã ghim` : 'Tin nhắn đã ghim'}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">
                                        {latestPinnedMessage?.audioUrl ? "🎵 Tin nhắn thoại" : latestPinnedMessage?.content}
                                    </div>
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[calc(100vw-2rem)] sm:w-[400px] max-h-[60vh] overflow-y-auto beautiful-scrollbar p-2 z-50 ml-4 mt-1">
                            <div className="space-y-2">
                                {pinnedMessages.map((msg) => {
                                    const sender = selectedConvo?.participants?.find(p => (p?._id || (p as any)?.userId?._id)?.toString() === msg.senderId?.toString());
                                    const displayName = selectedConvo?.nicknames?.[msg.senderId] || sender?.displayName || "Người dùng";
                                    return (
                                        <div
                                            key={msg._id}
                                            onClick={() => scrollToMessage(msg._id)}
                                            className="p-3 bg-muted/50 rounded-md hover:bg-muted cursor-pointer transition-colors"
                                        >
                                            <div className="text-xs font-semibold mb-1 text-primary">
                                                {displayName}
                                            </div>
                                            <div className="text-sm break-words whitespace-pre-wrap">
                                                {msg.audioUrl ? "🎵 Tin nhắn thoại" : msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            <div
                id="scrollableDiv"
                ref={containerRef}
                onScroll={handleScrollSave}
                className="flex-1 w-full flex flex-col-reverse overflow-y-auto overflow-x-hidden beautiful-scrollbar px-4 sm:px-6 py-3 z-10"
            >
                <div ref={messagesEndRef}></div>

                {activeTypingUsers.map((typingUserId) => {
                    const isAI = typingUserId === "000000000000000000000000";
                    const typingUser = selectedConvo?.participants?.find(p => p?._id?.toString() === typingUserId?.toString());
                    if (!typingUser && !isAI) return null;
                    
                    const isIncognito = selectedConvo?.type === "direct" && selectedConvo?.incognitoMode?.isActive;
                    const avatarUrl = isIncognito 
                        ? "https://cdn-icons-png.flaticon.com/512/868/1236413.png" 
                        : (isAI ? "https://cdn-icons-png.flaticon.com/512/826/826963.png" : (typingUser as any)?.avatarUrl);
                    const displayName = isIncognito 
                        ? "Người Lạ" 
                        : (isAI ? "NexusAI" : (selectedConvo?.nicknames?.[typingUserId] || (typingUser as any)?.displayName || "User"));

                    return (
                        <div key={typingUserId} className="flex items-end mb-2 mt-1 opacity-70 transition-opacity justify-start w-full gap-2">
                            <div className="w-8">
                                <UserAvatar
                                    type="chat"
                                    name={displayName}
                                    avatarUrl={avatarUrl}
                                />
                            </div>
                            <div className="bg-muted p-3 rounded-2xl rounded-bl-sm w-fit flex gap-1.5 items-center h-[38px]">
                                <span className="size-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="size-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="size-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    );
                })}

                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessages}
                    hasMore={hasMore}
                    scrollableTarget="scrollableDiv"
                    loader={<p>Đang tải...</p>}
                    inverse={true}
                    style={{
                        display: "flex",
                        flexDirection: "column-reverse",
                        overflow: "visible",
                    }}
                >
                    {reversedMessages.map((message, index) => (
                        <MessageItem
                            key={message._id ?? index}
                            message={message}
                            index={index}
                            messages={reversedMessages}
                            selectedConvo={selectedConvo}
                            lastMessageStatus={lastMessageStatus}
                        />
                    ))}
                </InfiniteScroll>
            </div>
            
            <ForwardMessageModal />
        </div>
    );
};

export default ChatWindowBody;