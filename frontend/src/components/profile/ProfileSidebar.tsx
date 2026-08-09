import { useProfileStore } from "@/stores/useProfileStore";
import { X, Calendar, Phone } from "lucide-react";
import UserAvatar from "../chat/UserAvatar";

const ProfileSidebar = () => {
  const { isOpen, profileData, loading, closeProfile } = useProfileStore();

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-sm transition-all duration-300 animate-in slide-in-from-right-8 relative z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Hồ sơ</h2>
        <button
          onClick={closeProfile}
          className="p-1 hover:bg-muted rounded-full transition-colors"
        >
          <X className="size-5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4 flex flex-col items-center">
        {loading || !profileData ? (
          <div className="flex flex-col items-center justify-center h-full w-full space-y-4">
            <div className="size-24 rounded-full bg-muted animate-pulse"></div>
            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded mt-4"></div>
          </div>
        ) : (
          <>
            {/* Avatar */}
            <div className="mt-4 mb-4 relative">
              <UserAvatar
                type="profile"
                name={profileData.displayName}
                avatarUrl={profileData.avatarUrl}
              />
              <div
                className={`absolute bottom-1 right-1 size-5 rounded-full border-4 border-card ${
                  profileData.presenceStatus === "online"
                    ? "bg-green-500"
                    : profileData.presenceStatus === "busy"
                    ? "bg-red-500"
                    : "bg-gray-400"
                }`}
                title={
                  profileData.presenceStatus === "online"
                    ? "Đang hoạt động"
                    : profileData.presenceStatus === "busy"
                    ? "Đang bận"
                    : "Ngoại tuyến"
                }
              ></div>
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-center">
              {profileData.displayName}
            </h3>

            {/* Bio */}
            {profileData.bio && (
              <p className="mt-4 text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg w-full">
                {profileData.bio}
              </p>
            )}

            <div className="w-full mt-6 space-y-4">
              {/* Phone */}
              {profileData.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{profileData.phone}</p>
                  </div>
                </div>
              )}

              {/* Joined Date */}
              {profileData.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tham gia từ</p>
                    <p className="font-medium">
                      {new Date(profileData.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSidebar;
