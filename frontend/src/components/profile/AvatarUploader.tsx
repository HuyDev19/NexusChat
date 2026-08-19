import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRef } from "react";
import { Button } from "../ui/button";
import { Camera, X } from "lucide-react";

const AvatarUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateAvatarUrl, removeAvatar } = useUserStore();
  const { user } = useAuthStore();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn gỡ ảnh đại diện không?")) {
      await removeAvatar();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    await updateAvatarUrl(formData);
  };

  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleClick}
        className="absolute -bottom-2 -right-2 size-9 rounded-full shadow-md hover:scale-115 transition duration-300 hover:bg-background z-10"
      >
        <Camera className="size-4" />
      </Button>

      {user?.avatarUrl && (
        <Button
          size="icon"
          variant="secondary"
          onClick={handleRemove}
          className="absolute top-0 left-0 size-6 rounded-full shadow-md hover:scale-115 transition duration-300 z-10 bg-muted/80 hover:bg-muted text-muted-foreground"
        >
          <X className="size-3" />
        </Button>
      )}

      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleUpload}
      />
    </>
  );
};

export default AvatarUploader;