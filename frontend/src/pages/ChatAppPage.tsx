import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import IncomingCallModal from "@/components/call/IncomingCallModal";
import CallRoomModal from "@/components/call/CallRoomModal";
import AccountInfoModal from "@/components/profile/AccountInfoModal";

const ChatAppPage = () => {
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
    </SidebarProvider>
  );
};

export default ChatAppPage;