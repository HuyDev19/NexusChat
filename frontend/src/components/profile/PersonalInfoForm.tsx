import { Heart, Plus, Trash2, Camera, Loader2, Image as ImageIcon } from "lucide-react";
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

  const userPhotos = user?.photos || userInfo.photos || [];

  return (
    <div className="space-y-6">
      <Card className="glass-strong border-border/30">
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
                  className="glass-light border-border/30"
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
              className="resize-none glass-light border-border/30"
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
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
                return (
                  <div
                    key={photo._id}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 shadow-xs hover:shadow-md transition-all"
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
                          onClick={() => handleDeletePhoto(photo._id)}
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
                        {totalReactions > 0 && (
                          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm w-fit px-1.5 py-0.5 rounded-full border border-white/20">
                            <Heart className="size-3 text-red-400 fill-red-400" />
                            <span className="text-[10px] text-white font-bold">{totalReactions}</span>
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
    </div>
  );
};

export default PersonalInfoForm;
