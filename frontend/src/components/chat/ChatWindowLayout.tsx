import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect } from "react";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";
import ProfileSidebar from "../profile/ProfileSidebar";
import LockedChatScreen from "./LockedChatScreen";
import { useAuthStore } from "@/stores/useAuthStore";

import OfflineBanner from "./OfflineBanner";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messageLoading: loading,
    unlockedConversations,
    markAsSeen,
  } = useChatStore();

  const { user } = useAuthStore();

  const selectedConvo =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  useEffect(() => {
    if (!selectedConvo) {
      return;
    }

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Lỗi khi markSeen", error);
      }
    };

    markSeen();
  }, [markAsSeen, selectedConvo]);

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  if (loading) {
    return <ChatWindowSkeleton />;
  }

  const isLocked = user?.lockedConversations?.some(
    (l) => l.conversationId === activeConversationId
  );
  const isUnlockedLocally = unlockedConversations.includes(activeConversationId as string);

  if (isLocked && !isUnlockedLocally) {
    return (
      <div className="flex w-full h-full overflow-hidden relative">
        <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md transition-all duration-300">
          <LockedChatScreen conversationId={activeConversationId as string} />
        </SidebarInset>
        <ProfileSidebar />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      <SidebarInset className="flex flex-col h-full flex-1 overflow-hidden rounded-sm shadow-md transition-all duration-300">
        {/* Header */}
        <ChatWindowHeader chat={selectedConvo} />

        {/* Offline & Sync Status Banner */}
        <OfflineBanner />

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-primary-foreground">
          <ChatWindowBody />
        </div>

        {/* Footer */}
        <MessageInput selectedConvo={selectedConvo} />
      </SidebarInset>

      <ProfileSidebar />
    </div>
  );
};

export default ChatWindowLayout;