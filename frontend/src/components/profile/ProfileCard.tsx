import type { User } from "@/types/user";
import { Card, CardContent } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { Badge } from "../ui/badge";
import { cn, isNoteExpired } from "@/lib/utils";
import AvatarUploader from "./AvatarUploader";
import CoverUploader from "./CoverUploader";
import { ZoomIn } from "lucide-react";
import { useMediaViewerStore } from "@/stores/useMediaViewerStore";

interface ProfileCardProps {
  user: User | null;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
  if (!user) return null;

  if (!user.bio) {
    user.bio = "Will code for food 💻";
  }

  const handleOpenCover = () => {
    if (user.coverUrl) {
      useMediaViewerStore.getState().openSingle(
        user.coverUrl,
        "Ảnh bìa",
        user.displayName,
        user.avatarUrl
      );
    }
  };

  const handleOpenAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.avatarUrl) {
      useMediaViewerStore.getState().openSingle(
        user.avatarUrl,
        "Ảnh đại diện",
        user.displayName,
        user.avatarUrl
      );
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden p-0 h-52 relative bg-cover bg-center rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl select-none group/cover",
        user.coverUrl && "cursor-pointer"
      )}
      style={{ 
        backgroundImage: user.coverUrl 
          ? `url(${user.coverUrl})` 
          : "linear-gradient(to right, #6366f1, #a855f7, #ec4899)" 
      }}
      onClick={handleOpenCover}
      title={user.coverUrl ? "Bấm để xem phóng to ảnh bìa" : undefined}
    >
      <CoverUploader />
      <div className="absolute inset-0 bg-black/30 pointer-events-none group-hover/cover:bg-black/40 transition-colors" />

      <CardContent 
        className="relative z-10 mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative group/avatar">
          <div 
            className={cn(
              "relative transition-transform duration-200",
              user.avatarUrl && "cursor-pointer hover:scale-105"
            )}
            onClick={handleOpenAvatar}
            title={user.avatarUrl ? "Bấm để xem phóng to ảnh đại diện" : undefined}
          >
            <UserAvatar
              type="profile"
              name={user.displayName}
              avatarUrl={user.avatarUrl ?? undefined}
              className="ring-4 ring-white shadow-lg"
              note={isNoteExpired(user.note) ? undefined : user.note?.content}
            />
            {user.avatarUrl && (
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                <ZoomIn className="size-6 text-white drop-shadow-md" />
              </div>
            )}
          </div>

          <AvatarUploader />
        </div>

        {/* user info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
            {user.displayName}
          </h1>

          {user.bio && (
            <p className="text-white/80 text-sm mt-2 max-w-lg line-clamp-2 drop-shadow-sm">
              {user.bio}
            </p>
          )}
        </div>

        {/* status */}
        <Badge
          className={cn(
            "flex items-center gap-1 capitalize hover:bg-background/80 transition-colors shadow-sm",
            user.presenceStatus === 'online' || !user.presenceStatus ? "bg-green-100 text-green-700" : 
            user.presenceStatus === 'busy' ? "bg-red-100 text-red-700" :
            "bg-slate-100 text-slate-700"
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              user.presenceStatus === 'online' || !user.presenceStatus ? "bg-green-500 animate-pulse" : 
              user.presenceStatus === 'busy' ? "bg-red-500" :
              "bg-slate-500"
            )}
          />

          {user.presenceStatus === 'busy' ? "đang bận" :
           user.presenceStatus === 'offline' ? "ngoại tuyến" : "trực tuyến"}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;