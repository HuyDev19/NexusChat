import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useUserStore } from "@/stores/useUserStore";

const CoverUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { updateCoverUrl } = useUserStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước file quá lớn (tối đa 5MB)!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await updateCoverUrl(formData);
    setIsUploading(false);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 border-0 backdrop-blur-sm shadow-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin mr-2" />
        ) : (
          <Camera className="size-4 mr-2" />
        )}
        Đổi ảnh bìa
      </Button>
    </>
  );
};

export default CoverUploader;
