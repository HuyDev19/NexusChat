import { useEffect, useRef, useState } from "react";
import { X, Send, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/axios";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export const FeedbackModal = ({ open, onClose }: FeedbackModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) { setMounted(true); setSubmitted(false); setError(""); }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted && !open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/feedback", { name, email, message });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setName(""); setEmail(""); setMessage(""); setSubmitted(false);
      }, 2400);
    } catch {
      setError("Gửi thất bại, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm cursor-pointer"
        style={{
          background: "rgba(15,10,63,0.55)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg bg-white dark:bg-[#0f0f1a] rounded-3xl shadow-2xl overflow-hidden"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(32px) scale(0.97)",
          transition: "opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-indigo-500" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Góp ý & Cải thiện</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ý kiến của bạn giúp chúng tôi phát triển</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">Cảm ơn bạn đã góp ý!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                Nhóm phát triển đã nhận được phản hồi của bạn và sẽ xem xét sớm.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Họ tên</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Email *(tuỳ chọn)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Ý kiến của bạn <span className="text-primary">*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Ví dụ: Tôi muốn có tính năng tìm kiếm toàn cục, hoặc giao diện tối hơn ở phần sidebar..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Lưu vào cơ sở dữ liệu nhóm
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {loading ? "Đang gửi..." : "Gửi góp ý"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
