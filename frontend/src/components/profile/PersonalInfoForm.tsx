import { Heart, Plus, Trash2, Camera, Loader2, Image as ImageIcon, X, Smile } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAccountInfoModalStore } from "@/stores/useAccountInfoModalStore";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥"];

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
  label: string;
  type?: string;
  disabled?: boolean;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "username", label: "Tên người dùng", disabled: true },
  { key: "email", label: "Email", type: "email", disabled: true },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const { updateProfile } = useUserStore();
  const { user, setUser } = useAuthStore();
  const { setUserPhotos } = useAccountInfoModalStore();
  
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
    bio: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile Photo Upload States
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userInfo) {
      setFormData({
        displayName: userInfo.displayName || "",
        phone: userInfo.phone || "",
        bio: userInfo.bio || "",
      });
    }
  }, [userInfo]);

  if (!userInfo) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await updateProfile({
      displayName: formData.displayName,
      phone: formData.phone,
      bio: formData.bio,
    });
    setIsSubmitting(false);
  };

  const handleSelectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setShowAddPhotoModal(true);
    }
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
      if (user) {
        setUser({ ...user, photos: res.photos });
      }
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

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi trang cá nhân không?")) return;
    try {
      const res = await userService.deleteProfilePhoto(photoId);
      if (user) {
        setUser({ ...user, photos: res.photos });
      }
      setUserPhotos(res.photos);
      toast.success("Đã xóa ảnh thành công");
    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      toast.error("Không thể xóa ảnh");
    }
  };

  const handleReactPhoto = async (photoId: string, emoji: string) => {
    if (!user?._id) return;
    try {
      const res = await userService.reactProfilePhoto(user._id, photoId, emoji);
      if (user) {
        setUser({ ...user, photos: res.photos });
      }
      setUserPhotos(res.photos);
      if (selectedPhoto && selectedPhoto._id === photoId) {
        setSelectedPhoto({ ...selectedPhoto, reactions: res.reactions });
      }
    } catch (error) {
      console.error("Lỗi tương tác ảnh:", error);
      toast.error("Không thể gửi cảm xúc");
    }
  };

  const userPhotos = user?.photos || userInfo.photos || [];

  // Đồng bộ selectedPhoto với real-time updates từ userPhotos
  useEffect(() => {
    if (selectedPhoto) {
      const updatedPhoto = userPhotos.find((p: any) => p._id === selectedPhoto._id);
      if (updatedPhoto) {
        setSelectedPhoto(updatedPhoto);
      }
    }
  }, [userPhotos]);

  return (
    <div className="space-y-6">
      <Card className="glass-strong border-border/30 rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-5 text-primary" />
            Thông tin cá nhân
          </CardTitle>
          <CardDescription>
            Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSONAL_FIELDS.map(({ key, label, type, disabled }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type ?? "text"}
                  value={disabled ? (userInfo[key] ?? "") : formData[key as keyof typeof formData]}
                  onChange={disabled ? undefined : handleChange}
                  disabled={disabled}
                  className="glass-light border-border/30 rounded-2xl h-10"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Tiểu sử</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={handleChange}
              className="resize-none glass-light border-border/30 rounded-2xl"
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/150
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-2xl font-semibold px-6 shadow-md shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Card Quản lý Ảnh trang cá nhân */}
      <Card className="glass-strong border-border/30">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="size-5 text-primary" />
              Ảnh trang cá nhân {userPhotos.length > 0 && `(${userPhotos.length})`}
            </CardTitle>
            <CardDescription>
              Quản lý và đăng hình ảnh hiển thị trên trang cá nhân của bạn
            </CardDescription>
          </div>
          
          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleSelectPhotoFile}
          />
          <Button
            size="sm"
            className="rounded-xl font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => photoInputRef.current?.click()}
          >
            <Plus className="size-4" />
            Thêm ảnh
          </Button>
        </CardHeader>

        <CardContent className="pt-1">
          {userPhotos.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground rounded-xl border border-dashed border-border/60 bg-muted/20">
              <ImageIcon className="size-8 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs">Bạn chưa đăng ảnh nào lên trang cá nhân</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-xs font-medium text-primary hover:underline"
                onClick={() => photoInputRef.current?.click()}
              >
                Tải lên bức ảnh đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPhotos.map((photo) => {
                const totalReactions = (photo.reactions || []).length;
                const reactionCountMap: Record<string, number> = {};
                (photo.reactions || []).forEach((r: any) => {
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <Button
                          size="icon"
                          variant="destructive"
                          className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo._id);
                          }}
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div>
                        {photo.caption && (
                          <p className="text-[11px] text-white font-medium truncate mb-0.5">
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Thêm Ảnh */}
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

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl gap-1.5 h-8"
                  onClick={() => {
                    handleDeletePhoto(selectedPhoto._id);
                    setSelectedPhoto(null);
                  }}
                >
                  <Trash2 className="size-4" />
                  Xóa ảnh
                </Button>
              </div>

              {/* Emoji Reaction Bar */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {EMOJI_REACTIONS.map((emoji) => {
                    const isMyReaction = (selectedPhoto.reactions || []).some(
                      (r: any) => (r.userId?._id || r.userId)?.toString() === user?._id && r.emoji === emoji
                    );
                    const reactionsForEmoji = (selectedPhoto.reactions || []).filter((r: any) => r.emoji === emoji);
                    const count = reactionsForEmoji.length;

                    return (
                      <div key={emoji} className="relative group/reaction">
                        <button
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
                        
                        {count > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/reaction:flex flex-col gap-1.5 bg-black/90 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-xl min-w-[140px] z-50">
                            <span className="text-[10px] text-zinc-400 font-semibold px-1 uppercase tracking-wider">Đã thả {emoji}</span>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto beautiful-scrollbar">
                              {reactionsForEmoji.map((r: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-white bg-white/5 p-1 rounded-md">
                                  <img src={r.userId?.avatarUrl || "https://github.com/shadcn.png"} alt="avatar" className="size-4 rounded-full object-cover" />
                                  <span className="truncate max-w-[90px]">{r.userId?.displayName || "Người dùng"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs font-medium text-zinc-400">
                  {(selectedPhoto.reactions || []).length} lượt cảm xúc
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PersonalInfoForm;
