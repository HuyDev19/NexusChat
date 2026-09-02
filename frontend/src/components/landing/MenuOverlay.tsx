import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { PenguinIcon } from "@/components/ui/PenguinIcon";

interface MenuOverlayProps {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { label: "Tính năng", href: "#trust" },
  { label: "Bảo mật", href: "#features" },
  { label: "Cập nhật", href: "#changelog" },
  { label: "Đánh giá", href: "#testimonials" },
];

export const MenuOverlay = ({ open, onClose }: MenuOverlayProps) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted && !open) return null;

  const handleNavClick = (href: string) => {
    onClose();
    setTimeout(() => {
      const id = href.replace("#", "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex flex-col h-full px-3 sm:px-3"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-24px)",
          transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Inner card to match page inset */}
        <div className="flex flex-col h-full rounded-2xl px-6 sm:px-10 py-6 sm:py-8">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <PenguinIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-white text-base font-medium uppercase tracking-[0.2em]">
                NexusChat
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
              style={{ background: "rgba(255,255,255,0.15)" }}
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Center nav */}
          <nav className="flex-1 flex flex-col justify-center gap-2">
            {NAV_LINKS.map((link, i) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-4xl sm:text-6xl font-semibold tracking-tight text-white/90 hover:text-purple-300 transition-colors leading-tight"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(28px)",
                  transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${120 + i * 70}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${120 + i * 70}ms`,
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Bottom row */}
          <div
            className="flex flex-col gap-4 pt-6 mt-auto border-t"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}
          >
            <Link
              to="/signup"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-[15px] font-bold uppercase tracking-wide px-6 py-4 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:from-primary/90 hover:to-purple-600/90 transition-all"
            >
              Đăng ký tài khoản
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </Link>
            <Link
              to="/signin"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-white/10 text-white text-[15px] font-semibold uppercase tracking-wide px-6 py-4 hover:bg-white/20 transition-all border border-white/10"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
