import type { Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Camera } from "lucide-react";

interface GroupChatAvatarProps {
  participants: Participant[];
  type: "chat" | "sidebar" | "profile";
  groupAvatar?: string | null;
  groupName?: string | null;
}

const GroupChatAvatar = ({ participants, type, groupAvatar, groupName }: GroupChatAvatarProps) => {
  if (groupAvatar) {
    return (
      <UserAvatar
        type={type}
        name={groupName || "Nhóm"}
        avatarUrl={groupAvatar}
      />
    );
  }
  
  // Default fallback when no group avatar is set
  const sizeClasses = {
    chat: "size-10",
    sidebar: "size-12",
    profile: "size-24"
  };

  const iconSizes = {
    chat: "size-5",
    sidebar: "size-6",
    profile: "size-10"
  };

  return (
    <div className={`relative flex items-center justify-center rounded-full bg-muted/80 border border-border/50 shadow-sm shrink-0 overflow-hidden ${sizeClasses[type]}`}>
      <Camera className={`text-muted-foreground/70 ${iconSizes[type]}`} />
    </div>
  );
};

export default GroupChatAvatar;