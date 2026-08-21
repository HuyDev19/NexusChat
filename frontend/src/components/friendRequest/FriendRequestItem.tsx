import type { FriendRequest } from "@/types/user";
import type { ReactNode } from "react";
import UserAvatar from "../chat/UserAvatar";
import { useAccountInfoModalStore } from "@/stores/useAccountInfoModalStore";

interface RequestItemProps {
  requestInfo: FriendRequest;
  actions: ReactNode;
  type: "sent" | "received";
}

const FriendRequestItem = ({ requestInfo, actions, type }: RequestItemProps) => {
  const { openAccountModal } = useAccountInfoModalStore();

  if (!requestInfo) {
    return null;
  }
  const info = type === "sent" ? requestInfo.to : requestInfo.from;

  if (!info) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-xl shadow-xs border border-border/50 bg-card p-3 hover:border-border transition-colors">
      <div 
        className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
        onClick={() => {
          if (info._id) {
            openAccountModal(info._id);
          }
        }}
        title="Bấm để xem thông tin trang cá nhân"
      >
        <div className="transition-transform group-hover:scale-105 shrink-0">
          <UserAvatar
            type="sidebar"
            name={info.displayName}
            avatarUrl={info.avatarUrl}
            userId={info._id}
          />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground group-hover:text-primary group-hover:underline transition-colors truncate">
            {info.displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">@{info.username}</p>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        {actions}
      </div>
    </div>
  );
};

export default FriendRequestItem;