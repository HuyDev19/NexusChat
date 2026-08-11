import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import IncomingCallModal from "@/components/call/IncomingCallModal";
import CallRoomModal from "@/components/call/CallRoomModal";

const ChatAppPage = () => {
  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-screen w-full p-2 relative">
        <ChatWindowLayout />
      </div>

      {/* Global Call Modals */}
      <IncomingCallModal />
      <CallRoomModal />
    </SidebarProvider>
  );
};

export default ChatAppPage;