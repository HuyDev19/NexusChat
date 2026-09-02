import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import api from "../../lib/axios";
import { toast } from "sonner";

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitReviewModal = ({ isOpen, onClose, onSuccess }: SubmitReviewModalProps) => {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Vui lòng nhập nội dung đánh giá");
    if (content.length > 500) return toast.error("Đánh giá quá dài (tối đa 500 ký tự)");

    setIsSubmitting(true);
    try {
      const res = await api.post("/reviews", { rating, content });
      toast.success(res.data.message || "Cảm ơn bạn đã gửi đánh giá!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-white/10">
          <h3 className="font-semibold text-lg">Viết Đánh Giá</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {!user ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">Bạn cần đăng nhập để có thể gửi đánh giá.</p>
              <button onClick={onClose} className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium">
                Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Mức độ hài lòng</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300 dark:text-slate-600"}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nhận xét của bạn</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ứng dụng rất tuyệt vời..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={500}
                />
                <div className="text-xs text-right text-muted-foreground mt-1">
                  {content.length}/500
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi Đánh Giá"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
