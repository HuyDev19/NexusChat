import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useAccountInfoModalStore, type ProfilePhoto } from "@/stores/useAccountInfoModalStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { useCallStore } from "@/stores/useCallStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { 
  Phone, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  Clock, 
  Loader2, 
  ImageIcon, 
  Calendar, 
  Mail, 
  User as UserIcon,
  Plus,
  Trash2,
  Heart,
  Smile,
  X 
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn, isNoteExpired, getEffectiveStatus } from "@/lib/utils";
import { userService } from "@/services/userService";
import StatusBadge from "../chat/StatusBadge";
import { useSocketStore } from "@/stores/useSocketStore";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "🔥"];

const AccountInfoModal = () => {
  const { isOpen, user: profileUser, loading, closeAccountModal, setUserPhotos, updatePhotoReactions } = useAccountInfoModalStore();
  const { user: currentUser } = useAuthStore();
  const { friends, sentList, receivedList, addFriend, cancelRequest, acceptRequest } = useFriendStore();
  const { conversations, messages: chatMessages, fetchMessages, setActiveConversation, createConversation } = useChatStore();
  const { startCall } = useCallStore();
  const { onlineUsers, lastActiveMap } = useSocketStore();
  
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Profile Photo Upload & Reaction States
  const [selectedPhoto, setSelectedPhoto] = useState<ProfilePhoto | null>(null);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Tìm cuộc trò chuyện trực tiếp nếu có
  const directConvo = conversations.find(
    (c) => c.type === "direct" && c.participants?.some((p) => p._id === profileUser?._id)
  );

  const convoMessages = directConvo ? (chatMessages[directConvo._id]?.items || []) : [];

  useEffect(() => {
    if (directConvo?._id && convoMessages.length === 0) {
      fetchMessages(directConvo._id);
    }
  }, [directConvo?._id]);

  const sharedImages = convoMessages.filter((m) => !!m.imgUrl && !m.isRecalled);

  if (!isOpen && !previewImage && !selectedPhoto && !showAddPhotoModal) return null;

  const isSelf = Boolean(currentUser?._id && profileUser?._id && currentUser._id === profileUser._id);
  const isFriend = Boolean(profileUser?._id && (friends || []).some((f) => (f?._id || f)?.toString() === profileUser._id));
  const sentReq = (sentList || []).find((r) => {
    const toId = (r?.to?._id || r?.to)?.toString();
    return Boolean(toId && profileUser?._id && toId === profileUser._id);
  });
  const receivedReq = (receivedList || []).find((r) => {
    const fromId = (r?.from?._id || r?.from)?.toString();
    return Boolean(fromId && profileUser?._id && fromId === profileUser._id);
  });

  const handleSendMessage = async () => {
    if (!profileUser?._id) return;
    try {
      setActionLoading(true);
      if (directConvo) {
        setActiveConversation(directConvo._id);
      } else {
        await createConversation("direct", "", [profileUser._id]);
      }
      closeAccountModal();
    } catch (error) {
      console.error("Lỗi khi mở đoạn chat:", error);
      toast.error("Không thể mở cuộc trò chuyện");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartCall = async (isVideo: boolean = false) => {
    if (!profileUser?._id) return;
    try {
      let convoId = directConvo?._id;
      if (!convoId) {
        const newConvo = await createConversation("direct", "", [profileUser._id]);
        convoId = newConvo?._id;
      }
      if (convoId) {
        closeAccountModal();
        await startCall(convoId, isVideo);
      }
    } catch (error) {
      console.error("Lỗi khi gọi điện:", error);
      toast.error("Không thể khởi tạo cuộc gọi");
    }
  };

  const handleAddFriend = async () => {
    if (!profileUser?._id) return;
    try {
      setActionLoading(true);
      await addFriend(profileUser._id, "Xin chào, kết bạn với mình nhé!");
      toast.success("Đã gửi lời mời kết bạn");
    } catch (error) {
      toast.error("Không thể gửi lời mời kết bạn");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!sentReq?._id) return;
    try {
      setActionLoading(true);
      await cancelRequest(sentReq._id);
      toast.success("Đã hủy lời mời kết bạn");
    } catch (error) {
      toast.error("Không thể hủy lời mời");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!receivedReq?._id) return;
    try {
      setActionLoading(true);
      await acceptRequest(receivedReq._id);
      toast.success("Đã đồng ý kết bạn");
    } catch (error) {
      toast.error("Không thể chấp nhận lời mời");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setShowAddPhotoModal(true);
    }
    // reset input value so re-selecting works
    e.target.value = "";
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", photoFile);
      if (photoCaption.trim()) {
        formData.append("caption", photoCaption.trim());
      }
      const res = await userService.addProfilePhoto(formData);
      setUserPhotos(res.photos);
      setShowAddPhotoModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoCaption("");
      toast.success("Đã thêm ảnh vào trang cá nhân thành công!");
    } catch (error) {
      console.error("Lỗi khi đăng ảnh:", error);
      toast.error("Không thể đăng ảnh");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleReactPhoto = async (photoId: string, emoji: string) => {
    if (!profileUser?._id) return;
    try {
      const res = await userService.reactProfilePhoto(profileUser._id, photoId, emoji);
      updatePhotoReactions(photoId, res.reactions);
      if (selectedPhoto && selectedPhoto._id === photoId) {
        setSelectedPhoto({ ...selectedPhoto, reactions: res.reactions });
      }
    } catch (error) {
      console.error("Lỗi tương tác ảnh:", error);
      toast.error("Không thể gửi cảm xúc");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi trang cá nhân không?")) return;
    try {
      const res = await userService.deleteProfilePhoto(photoId);
      setUserPhotos(res.photos);
      setSelectedPhoto(null);
      toast.success("Đã xóa ảnh thành công");
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      toast.error("Không thể xóa ảnh");
    }
  };

  const noteText = typeof profileUser?.note === "string" 
    ? profileUser.note 
    : (!isNoteExpired(profileUser?.note) ? profileUser?.note?.content : null);

  let formattedJoinDate = "Chưa cập nhật";
  try {
    if (profileUser?.createdAt) {
      const d = new Date(profileUser.createdAt);
      if (!isNaN(d.getTime())) {
        formattedJoinDate = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
    }
  } catch (e) {}

  let formattedDob = formattedJoinDate;
  try {
    if (profileUser?.dob) {
      const d = new Date(profileUser.dob);
      if (!isNaN(d.getTime())) {
        formattedDob = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
      }
    }
  } catch (e) {}

  const profilePhotos = profileUser?.photos || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={closeAccountModal}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl">
          <DialogHeader className="px-5 py-3.5 border-b border-border/60 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-foreground">
              Thông tin tài khoản
            </DialogTitle>
          </DialogHeader>

          {loading || !profileUser ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="flex flex-col max-h-[80vh] overflow-y-auto">
              {/* Cover & Avatar Header */}
              <div className="relative">
                <div 
                  className={cn(
                    "h-44 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 overflow-hidden",
                    profileUser.coverUrl && "cursor-pointer hover:opacity-90 transition-opacity"
                  )}
                  onClick={() => {
                    if (profileUser.coverUrl) setPreviewImage(profileUser.coverUrl);
                  }}
                  title={profileUser.coverUrl ? "Bấm để xem ảnh bìa" : undefined}
                >
                  {profileUser.coverUrl ? (
                    <img
                      src={profileUser.coverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full opacity-60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-indigo-500 to-purple-800" />
                  )}
                </div>

                {/* Avatar */}
                <div 
                  className={cn(
                    "absolute -bottom-10 left-6",
                    profileUser.avatarUrl && "cursor-pointer hover:scale-105 transition-transform"
                  )}
                  onClick={() => {
                    if (profileUser.avatarUrl) setPreviewImage(profileUser.avatarUrl);
                  }}
                  title={profileUser.avatarUrl ? "Bấm để xem ảnh đại diện" : undefined}
                >
                  <Avatar className="size-20 border-4 border-background shadow-xl ring-2 ring-border/20">
                    <AvatarImage src={profileUser.avatarUrl || undefined} alt={profileUser.displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-2xl">
                      {profileUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <StatusBadge
                    status={getEffectiveStatus(
                      profileUser._id ? onlineUsers.includes(profileUser._id) : false,
                      profileUser.presenceStatus
                    )}
                    lastActiveAt={profileUser._id ? (lastActiveMap?.[profileUser._id] || profileUser.lastActiveAt) : null}
                  />
                </div>
              </div>

              {/* Display Name & Bio */}
              <div className="pt-12 px-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {profileUser.displayName}
                    </h3>
                    {profileUser.username && (
                      <p className="text-xs text-muted-foreground font-medium">@{profileUser.username}</p>
                    )}
                  </div>
                </div>

                {noteText && (
                  <div className="mt-3 px-3.5 py-2 rounded-xl bg-muted/60 border border-border/50 text-sm text-foreground/90 italic">
                    "{noteText}"
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  {isSelf ? (
                    <Button 
                      variant="outline" 
                      className="col-span-2 rounded-xl font-semibold h-10"
                      onClick={() => {
                        closeAccountModal();
                      }}
                    >
                      Tài khoản của bạn
                    </Button>
                  ) : isFriend ? (
                    <>
                      <Button
                        variant="secondary"
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary"
                        onClick={() => handleStartCall(false)}
                        disabled={actionLoading}
                      >
                        <Phone className="size-4" />
                        Gọi điện
                      </Button>
                      <Button
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={handleSendMessage}
                        disabled={actionLoading}
                      >
                        <MessageSquare className="size-4" />
                        Nhắn tin
                      </Button>
                    </>
                  ) : receivedReq ? (
                    <>
                      <Button
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                        onClick={handleAcceptRequest}
                        disabled={actionLoading}
                      >
                        <UserCheck className="size-4" />
                        Chấp nhận
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2"
                        onClick={handleSendMessage}
                        disabled={actionLoading}
                      >
                        <MessageSquare className="size-4" />
                        Nhắn tin
                      </Button>
                    </>
                  ) : sentReq ? (
                    <>
                      <Button
                        variant="outline"
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                        onClick={handleCancelRequest}
                        disabled={actionLoading}
                      >
                        <Clock className="size-4" />
                        Hủy lời mời
                      </Button>
                      <Button
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                        onClick={handleSendMessage}
                        disabled={actionLoading}
                      >
                        <MessageSquare className="size-4" />
                        Nhắn tin
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                        onClick={handleAddFriend}
                        disabled={actionLoading}
                      >
                        <UserPlus className="size-4" />
                        Kết bạn
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-xl font-semibold h-10 flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary"
                        onClick={handleSendMessage}
                        disabled={actionLoading}
                      >
                        <MessageSquare className="size-4" />
                        Nhắn tin
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="h-2 bg-muted/40 border-y border-border/40" />

              {/* Thông tin cá nhân */}
              <div className="p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground">Thông tin cá nhân</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <UserIcon className="size-4 text-muted-foreground/70" />
                      Giới tính
                    </span>
                    <span className="font-medium text-foreground">{profileUser.gender || "Nam"}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground/70" />
                      Ngày tham gia
                    </span>
                    <span className="font-medium text-foreground">{formattedDob}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground/70" />
                      Email
                    </span>
                    <span className="font-medium text-foreground">
                      {profileUser.email || "Chưa cập nhật"}
                    </span>
                  </div>

                  {profileUser.bio && (
                    <div className="pt-2">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tiểu sử</span>
                      <p className="mt-1 p-3 rounded-xl bg-muted/40 border border-border/50 text-sm text-foreground">
                        {profileUser.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-2 bg-muted/40 border-y border-border/40" />

              {/* ========================================================= */}
              {/* ẢNH TRANG CÁ NHÂN (PERSONAL PHOTOS WITH EMOJI REACTIONS) */}
              {/* ========================================================= */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                      Ảnh trang cá nhân {profilePhotos.length > 0 && `(${profilePhotos.length})`}
                    </h4>
                  </div>

                  {isSelf && (
                    <>
                      <input
                        type="file"
                        ref={photoInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleSelectPhotoFile}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs font-semibold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <Plus className="size-3.5" />
                        Thêm ảnh
                      </Button>
                    </>
                  )}
                </div>

                {profilePhotos.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground rounded-xl border border-dashed border-border/60 bg-muted/20">
                    <ImageIcon className="size-8 text-muted-foreground/40 mb-1.5" />
                    <p className="text-xs">Chưa có ảnh nào trên trang cá nhân</p>
                    {isSelf && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-xs font-medium text-primary hover:underline h-7"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        Tải lên bức ảnh đầu tiên
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {profilePhotos.map((photo) => {
                      const totalReactions = (photo.reactions || []).length;
                      // Group reaction counts
                      const reactionCountMap: Record<string, number> = {};
                      (photo.reactions || []).forEach((r) => {
                        reactionCountMap[r.emoji] = (reactionCountMap[r.emoji] || 0) + 1;
                      });
                      const topEmojis = Object.keys(reactionCountMap).slice(0, 3);

                      return (
                        <div
                          key={photo._id}
                          className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer border border-border/40 shadow-xs hover:shadow-md transition-all duration-200"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || "Profile photo"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Overlay & Reactions Summary */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            {photo.caption && (
                              <p className="text-[11px] text-white font-medium truncate mb-1 drop-shadow-sm">
                                {photo.caption}
                              </p>
                            )}

                            {totalReactions > 0 ? (
                              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm w-fit px-1.5 py-0.5 rounded-full border border-white/20">
                                <span className="text-xs">{topEmojis.join("")}</span>
                                <span className="text-[10px] text-white font-bold">{totalReactions}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Smile className="size-3" />
                                <span>Bấm để thả cảm xúc</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL THÊM ẢNH CHO TRANG CÁ NHÂN                         */}
      {/* ========================================================= */}
      {showAddPhotoModal && (
        <Dialog open={showAddPhotoModal} onOpenChange={setShowAddPhotoModal}>
          <DialogContent className="max-w-md p-6 bg-background border border-border rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Thêm ảnh cho trang cá nhân</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {photoPreview && (
                <div className="relative aspect-video max-h-60 rounded-xl overflow-hidden bg-muted border border-border">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Mô tả / Caption (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border/60 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Chia sẻ khoảnh khắc, cảm nghĩ về bức ảnh này..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl font-semibold"
                  onClick={() => setShowAddPhotoModal(false)}
                  disabled={uploadingPhoto}
                >
                  Hủy
                </Button>
                <Button
                  className="rounded-xl font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleUploadPhoto}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    "Đăng ảnh"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================= */}
      {/* MODAL XEM CHI TIẾT ẢNH CÁ NHÂN & TƯƠNG TÁC CẢM XÚC        */}
      {/* ========================================================= */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[95vh] p-0 bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden rounded-2xl text-white">
            <div className="relative flex-1 flex items-center justify-center bg-black/50 p-2 min-h-[50vh] max-h-[70vh] overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Photo"}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Bottom Info & Reaction Bar */}
            <div className="p-4 bg-zinc-900/90 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {selectedPhoto.caption && (
                    <p className="text-sm font-medium text-white mb-1 leading-snug">
                      {selectedPhoto.caption}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400">
                    Đăng ngày {new Date(selectedPhoto.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </p>
                </div>

                {isSelf && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl gap-1.5 h-8"
                    onClick={() => handleDeletePhoto(selectedPhoto._id)}
                  >
                    <Trash2 className="size-4" />
                    Xóa ảnh
                  </Button>
                )}
              </div>

              {/* Emoji Reaction Bar */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {EMOJI_REACTIONS.map((emoji) => {
                    const isMyReaction = (selectedPhoto.reactions || []).some(
                      (r) => r.userId?.toString() === currentUser?._id && r.emoji === emoji
                    );
                    const count = (selectedPhoto.reactions || []).filter((r) => r.emoji === emoji).length;

                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReactPhoto(selectedPhoto._id, emoji)}
                        className={cn(
                          "px-3 py-1.5 rounded-full flex items-center gap-1.5 text-base transition-all duration-200 hover:scale-110 active:scale-95",
                          isMyReaction
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/60 font-bold shadow-md shadow-primary/30"
                            : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                        title={`Thả cảm xúc ${emoji}`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="text-xs font-semibold">{count}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Total reactions count */}
                <div className="text-xs font-medium text-zinc-400">
                  {(selectedPhoto.reactions || []).length} lượt cảm xúc
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lightbox xem ảnh đơn thuần (Cover / Avatar / Chat images) */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent
            className="max-w-[95vw] w-auto max-h-[95vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-visible"
            showCloseButton={false}
          >
            <div className="relative inline-flex flex-col items-center justify-center max-w-[92vw] max-h-[90vh]">
              <div className="absolute top-3 right-3 z-50 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-full border border-white/20 shadow-xl">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  title="Đóng (Esc)"
                >
                  <X className="size-4" />
                </button>
              </div>
              <img
                src={previewImage}
                alt="Preview"
                className="w-auto h-auto max-w-[90vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AccountInfoModal;
