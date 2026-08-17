import { useProfileStore } from "@/stores/useProfileStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { X, Calendar, Phone, Image as ImageIcon, CaseSensitive, Ban, Settings, FileText, Film, File, ChevronRight } from "lucide-react";
import UserAvatar from "../chat/UserAvatar";
import GroupChatAvatar from "../chat/GroupChatAvatar";
import { useState } from "react";
import WallpaperModal from "../chat/WallpaperModal";
import NicknameModal from "../chat/NicknameModal";
import GroupSettingsModal from "../chat/GroupSettingsModal";
import SharedMediaModal from "./SharedMediaModal";

const ProfileSidebar = () => {
  const { isOpen, profileData, loading, mode, closeProfile } = useProfileStore();
  const { conversations, activeConversationId } = useChatStore();
  const { user, blockUser, unblockUser } = useAuthStore();

  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [sharedMediaTab, setSharedMediaTab] = useState<"media" | "docs" | "links">("media");

  const messages = useChatStore(state => state.messages);
  
  if (!isOpen) return null;

  const chat = mode === "chat" ? conversations.find(c => c._id === activeConversationId) : null;
  const isDirect = chat?.type === "direct";
  const isGroup = chat?.type === "group";

  // For direct chats
  let otherUser: any = null;
  if (isDirect) {
    const participants = chat.participants || [];
    otherUser = participants.find((p) => p._id !== user?._id);
  }

  const isBlocked = otherUser && user?.blockedUsers?.includes(otherUser._id);

  const handleBlockUser = async () => {
    if (!otherUser) return;
    if (isBlocked) {
      await unblockUser(otherUser._id);
    } else {
      await blockUser(otherUser._id);
    }
  };

  const activeConvoMessages = activeConversationId ? messages[activeConversationId]?.items || [] : [];
  
  const imagesCount = activeConvoMessages.filter(m => !!m.imgUrl).length;
  const filesCount = activeConvoMessages.filter(m => !!m.audioUrl).length;
  const linksCount = activeConvoMessages.filter(m => m.content && /https?:\/\/[^\s]+/.test(m.content)).length;

  const renderStats = () => (
    <div className="w-full mt-6 space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Đa phương tiện & File</h4>
      
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-muted/30 rounded-xl p-3 flex flex-col justify-center border border-border/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Ảnh/Video</span>
          <span className="text-xl font-bold text-foreground">{imagesCount}</span>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-3 flex flex-col justify-center border border-border/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase">File</span>
          <span className="text-xl font-bold text-foreground">{filesCount}</span>
        </div>
        <div className="flex-1 bg-muted/30 rounded-xl p-3 flex flex-col justify-center border border-border/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Link</span>
          <span className="text-xl font-bold text-foreground">{linksCount}</span>
        </div>
      </div>

      <div className="space-y-1">
        <FileRow 
          icon={ImageIcon} 
          color="text-orange-500" 
          bg="bg-orange-500/10" 
          name="Hình ảnh & Video" 
          onClick={() => { setSharedMediaTab("media"); setShowSharedMedia(true); }}
        />
        <FileRow 
          icon={FileText} 
          color="text-indigo-500" 
          bg="bg-indigo-500/10" 
          name="Tài liệu" 
          onClick={() => { setSharedMediaTab("docs"); setShowSharedMedia(true); }}
        />
        <FileRow 
          icon={File} 
          color="text-teal-500" 
          bg="bg-teal-500/10" 
          name="File khác" 
          onClick={() => { setSharedMediaTab("docs"); setShowSharedMedia(true); }}
        />
      </div>
    </div>
  );

  return (
    <div className="w-80 h-full bg-card border-l border-border flex flex-col shadow-sm transition-all duration-300 animate-in slide-in-from-right-8 relative z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold">
          {mode === "chat" ? "Thông tin cuộc trò chuyện" : "Hồ sơ"}
        </h2>
        <button
          onClick={closeProfile}
          className="p-1 hover:bg-muted rounded-full transition-colors"
        >
          <X className="size-5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto beautiful-scrollbar p-4 flex flex-col items-center">
        {(mode === "user" && (loading || !profileData)) || (mode === "chat" && isDirect && loading) ? (
          <div className="flex flex-col items-center justify-center h-full w-full space-y-4">
            <div className="size-24 rounded-full bg-muted animate-pulse"></div>
            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded mt-4"></div>
          </div>
        ) : (
          <>
            {/* Avatar Section */}
            <div className="mt-8 mb-4 relative z-10">
              {mode === "chat" && isGroup ? (
                <GroupChatAvatar
                  participants={chat.participants || []}
                  type="chat"
                  groupAvatar={chat?.group?.avatar}
                  groupName={chat?.group?.name}
                />
              ) : (
                <>
                  <UserAvatar
                    type="profile"
                    name={mode === "chat" && isDirect ? (chat?.nicknames?.[otherUser?._id] || otherUser?.displayName) : profileData?.displayName}
                    avatarUrl={mode === "chat" && isDirect ? otherUser?.avatarUrl : profileData?.avatarUrl}
                    className="ring-4 ring-card bg-card"
                    note={mode === "chat" && isDirect ? otherUser?.note?.content : profileData?.note?.content}
                    userId={mode === "chat" && isDirect ? otherUser?._id : profileData?._id}
                  />
                  <div
                    className={`absolute bottom-1 right-1 size-5 rounded-full border-4 border-card ${
                      (mode === "chat" && isDirect ? otherUser?.presenceStatus : profileData?.presenceStatus) === "online"
                        ? "bg-green-500"
                        : (mode === "chat" && isDirect ? otherUser?.presenceStatus : profileData?.presenceStatus) === "busy"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                    title={
                      (mode === "chat" && isDirect ? otherUser?.presenceStatus : profileData?.presenceStatus) === "online"
                        ? "Đang hoạt động"
                        : (mode === "chat" && isDirect ? otherUser?.presenceStatus : profileData?.presenceStatus) === "busy"
                        ? "Đang bận"
                        : "Ngoại tuyến"
                    }
                  ></div>
                </>
              )}
            </div>

            {/* Name */}
            <h3 className="text-xl font-bold text-center text-foreground">
              {mode === "chat" && isGroup 
                ? chat?.group?.name 
                : mode === "chat" && isDirect 
                  ? (chat?.nicknames?.[otherUser?._id] || otherUser?.displayName) 
                  : profileData?.displayName}
            </h3>
            
            {mode === "chat" && isGroup && (
              <p className="text-sm text-muted-foreground mt-1">
                {chat?.participants?.length} thành viên
              </p>
            )}

            {/* Bio */}
            {profileData?.bio && (
              <p className="mt-4 text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg w-full">
                {profileData.bio}
              </p>
            )}

            <div className="w-full mt-6 space-y-4">
              {/* Phone & Joined Date for User Profile or Direct Chat */}
              {(!isGroup) && profileData?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium text-foreground">{profileData.phone}</p>
                  </div>
                </div>
              )}

              {(!isGroup) && profileData?.createdAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tham gia từ</p>
                    <p className="font-medium text-foreground">
                      {new Date(profileData.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Actions for Chat Mode */}
              {mode === "chat" && chat && (
                <div className="pt-4 border-t border-border mt-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tùy chỉnh trò chuyện</h4>
                  
                  <ActionRow icon={ImageIcon} label="Đổi hình nền" onClick={() => setShowWallpaperModal(true)} />
                  
                  {isDirect && (
                    <ActionRow icon={CaseSensitive} label="Đổi biệt danh" onClick={() => setShowNicknameModal(true)} />
                  )}
                  
                  {isGroup && (
                    <ActionRow icon={Settings} label="Cài đặt nhóm" onClick={() => setShowGroupSettings(true)} />
                  )}

                  {isDirect && (
                    <ActionRow 
                      icon={Ban} 
                      label={isBlocked ? "Bỏ chặn người dùng" : "Chặn người dùng"} 
                      onClick={handleBlockUser} 
                      danger={!isBlocked}
                      success={isBlocked}
                    />
                  )}
                </div>
              )}

              {/* Stats for Chat Mode */}
              {mode === "chat" && chat && renderStats()}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {chat && (
        <>
          <WallpaperModal open={showWallpaperModal} onOpenChange={setShowWallpaperModal} conversationId={chat._id} />
          <NicknameModal open={showNicknameModal} onOpenChange={setShowNicknameModal} conversation={chat} />
          {isGroup && (
            <GroupSettingsModal open={showGroupSettings} onOpenChange={setShowGroupSettings} conversation={chat} />
          )}
          <SharedMediaModal 
            open={showSharedMedia} 
            onOpenChange={setShowSharedMedia} 
            conversationId={chat._id} 
            defaultTab={sharedMediaTab} 
          />
        </>
      )}
    </div>
  );
};

const ActionRow = ({ icon: Icon, label, onClick, danger, success }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors ${
      danger ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : 
      success ? "text-green-500 hover:text-green-600 hover:bg-green-500/10" : 
      "text-foreground"
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="size-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  </button>
);

const FileRow = ({ icon: Icon, color, bg, name, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
  >
    <div className="flex items-center gap-3">
      <div className={`size-8 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`size-4 ${color}`} />
      </div>
      <span className="text-sm font-medium">{name}</span>
    </div>
    <ChevronRight className="size-4 text-muted-foreground" />
  </button>
);

export default ProfileSidebar;
