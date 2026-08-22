import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import IncomingCallModal from "@/components/call/IncomingCallModal";
import CallRoomModal from "@/components/call/CallRoomModal";
import AccountInfoModal from "@/components/profile/AccountInfoModal";
import ChannelPreviewModal from "@/components/chat/ChannelPreviewModal";
import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";

const ChatAppPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewChannelId, setPreviewChannelId] = useState<string | null>(null);

  useEffect(() => {
    const joinId = searchParams.get("join");
    if (joinId) {
      setPreviewChannelId(joinId);
    }
  }, [searchParams]);

  const handleClosePreview = () => {
    setPreviewChannelId(null);
    if (searchParams.has("join")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("join");
      setSearchParams(newParams);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-screen w-full p-2 relative">
        <ChatWindowLayout />
      </div>

      {/* Global Modals */}
      <IncomingCallModal />
      <CallRoomModal />
      <AccountInfoModal />
      <ChannelPreviewModal 
        isOpen={!!previewChannelId} 
        onOpenChange={(open) => !open && handleClosePreview()} 
        channelId={previewChannelId} 
      />
    </SidebarProvider>
  );
};

export default ChatAppPage;