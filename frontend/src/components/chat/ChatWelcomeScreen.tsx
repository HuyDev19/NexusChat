import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import { PenguinIcon } from "@/components/ui/PenguinIcon";

const ChatWelcomeScreen = () => {
  return (
    <SidebarInset className="flex w-full h-full bg-transparent">
      <ChatWindowHeader />
      <div className="flex bg-primary-foreground rounded-2xl flex-1 items-center justify-center">
        <div className="text-center">
          <div className="size-24 mx-auto mb-6 bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 pulse-ring">
            <PenguinIcon className="size-14 text-white drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-chat bg-clip-text text-transparent">
            Chào mừng bạn đến với NexusChat!
          </h2>
          <p className="text-muted-foreground">
            Chọn một cuộc trò chuyện để bắt đầu chat!
          </p>
        </div>
      </div>
    </SidebarInset>
  );
};

export default ChatWelcomeScreen;