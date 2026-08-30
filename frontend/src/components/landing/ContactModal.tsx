import { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { PenguinIcon } from "@/components/ui/PenguinIcon";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContactModal = ({ open, onClose }: ContactModalProps) => {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const t = setTimeout(() => nameRef.current?.focus(), 120);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setSuccess(false);
        setName("");
        setEmail("");
        setMessage("");
        setSubmitting(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 1200);
  };

  const firstName = name.split(" ")[0] || "there";

  if (!open && !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm cursor-pointer"
        style={{
          background: "rgba(15,10,63,0.5)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Đăng ký trải nghiệm"
        className="relative w-full max-w-sm sm:max-w-lg max-h-[92svh] overflow-y-auto rounded-2xl bg-white dark:bg-card shadow-2xl shadow-purple-950/40 p-6 sm:p-8 text-foreground"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
          transition: "opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Bắt đầu ngay
            </div>
            <div className="mt-3">
              <div className="line-clip">
                <h2
                  className="text-3xl sm:text-4xl font-semibold leading-[0.95] tracking-tight"
                  style={{ animation: open ? "lineReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0ms forwards" : "none", transform: "translateY(115%)" }}
                >
                  Trải nghiệm
                </h2>
              </div>
              <div className="line-clip">
                <h2
                  className="text-3xl sm:text-4xl font-semibold leading-[0.95] tracking-tight bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent"
                  style={{ animation: open ? "lineReveal 0.8s cubic-bezier(0.16,1,0.3,1) 90ms forwards" : "none", transform: "translateY(115%)" }}
                >
                  NexusChat
                </h2>
              </div>
            </div>
          </div>
          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted hover:bg-border flex items-center justify-center transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success panel */}
        {success ? (
          <div className="mt-8 rounded-xl bg-muted p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Đã nhận yêu cầu!</h3>
            <p className="text-sm text-muted-foreground">
              Cảm ơn, <span className="font-medium text-foreground">{firstName}</span> — chúng tôi sẽ liên hệ bạn sớm nhất!
            </p>
            <button
              onClick={onClose}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground text-background text-sm font-medium uppercase tracking-wide px-6 py-3 hover:bg-primary transition-colors"
            >
              Xong
            </button>
          </div>
        ) : (
          /* Form */
          <form className="mt-7 flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Họ và tên
              </label>
              <input
                ref={nameRef}
                type="text"
                placeholder="Nguyễn Văn An"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="ban@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Bạn muốn trải nghiệm gì?
              </label>
              <textarea
                rows={3}
                placeholder="Mình muốn thử tính năng nhắn tin nhóm và video call..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-full bg-foreground text-background text-sm font-medium uppercase tracking-wide px-7 py-3.5 hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang gửi..." : "Đăng ký ngay"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
