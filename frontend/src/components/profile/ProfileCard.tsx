import type { User } from "@/types/user";
import { Card, CardContent } from "../ui/card";
import UserAvatar from "../chat/UserAvatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { useSocketStore } from "@/stores/useSocketStore";
import AvatarUploader from "./AvatarUploader";
import CoverUploader from "./CoverUploader";

interface ProfileCardProps {
    user: User | null;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
    if (!user) return;

    if (!user.bio) {
        user.bio = "Will code for food 💻";
    }

    return (
        <Card 
            className="overflow-hidden p-0 h-52 relative bg-cover bg-center"
            style={{ 
                backgroundImage: user.coverUrl 
                    ? `url(${user.coverUrl})` 
                    : "linear-gradient(to right, #6366f1, #a855f7, #ec4899)" 
            }}
        >
            <CoverUploader />
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />
            <CardContent className="relative z-10 mt-20 pb-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <div className="relative">
                    <UserAvatar
                        type="profile"
                        name={user.displayName}
                        avatarUrl={user.avatarUrl ?? undefined}
                        className="ring-4 ring-white shadow-lg"
                        note={user.note?.content}
                    />

                    <AvatarUploader />
                </div>

                {/* user info */}
                <div className="text-center sm:text-left flex-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                        {user.displayName}
                    </h1>

                    {user.bio && (
                        <p className="text-white/70 text-sm mt-2 max-w-lg line-clamp-2">
                            {user.bio}
                        </p>
                    )}
                </div>

                {/* status */}
                <Badge
                    className={cn(
                        "flex items-center gap-1 capitalize hover:bg-background/80 transition-colors",
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