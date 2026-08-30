import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { ArrowRight } from "lucide-react";

interface FooterProps {
  onOpenContact: () => void;
}

const NAV_COLS = [
  {
    heading: "Sản phẩm",
    links: [
      { label: "Nhắn tin trực tiếp", href: "#dm" },
      { label: "Kênh & Nhóm", href: "#channels" },
      { label: "Video & Thoại", href: "#calls" },
      { label: "Chia sẻ File", href: "#files" },
    ],
  },
  {
    heading: "Tài nguyên",
    links: [
      { label: "Tài liệu", href: "#docs" },
      { label: "API Reference", href: "#api" },
      { label: "Trạng thái hệ thống", href: "#status" },
      { label: "Changelog", href: "#changelog" },
    ],
  },
  {
    heading: "Công ty",
    links: [
      { label: "Giới thiệu", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Tuyển dụng", href: "#careers" },
      { label: "Liên hệ", href: "#contact" },
    ],
  },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export const Footer = ({ onOpenContact }: FooterProps) => {
  const { ref, visible } = useInView(0.1);

  return (
    <footer
      id="contact"
      ref={ref as React.RefObject<HTMLElement>}
      className="rounded-[2rem] mt-3 px-6 sm:px-10 pt-14 sm:pt-16 pb-8"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #2d1f6e 40%, #1e1b4b 100%)",
        color: "white",
      }}
    >
      {/* CTA band */}
      <div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 pb-14"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}
      >
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.65)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            Bắt đầu ngay
          </div>
          <div className="mt-4">
            {["Sẵn sàng", "kết nối?"].map((line, i) => (
              <div key={line} className="line-clip">
                <p
                  className="text-6xl font-semibold leading-[0.92] tracking-tight text-white"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(115%)",
                    transition: `opacity 0.95s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms, transform 0.95s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
                  }}
                >
                  {line}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={onOpenContact}
          className="group inline-flex items-center gap-3 rounded-full bg-white text-indigo-950 text-sm font-medium uppercase tracking-wide px-7 py-4 hover:bg-purple-100 transition-colors self-start sm:self-auto shrink-0"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 150ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 150ms",
          }}
        >
          Bắt đầu chat
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Columns grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 py-14">
        {/* Brand column */}
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <PenguinIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-medium uppercase tracking-[0.2em] text-white">NexusChat</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Nền tảng nhắn tin thời gian thực thế hệ mới, xây dựng cho tốc độ, bảo mật, và các team thực sự làm việc.
          </p>
          <address className="mt-6 not-italic text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
            <a href="mailto:hello@nexuschat.app" className="block hover:text-white transition-colors">hello@nexuschat.app</a>
            <span className="block mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Ho Chi Minh City, Vietnam</span>
          </address>
        </div>

        {/* Nav columns */}
        {NAV_COLS.map((col) => (
          <nav key={col.heading}>
            <h4
              className="text-xs font-medium uppercase tracking-[0.2em] mb-5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {col.heading}
            </h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 text-sm"
        style={{ borderTop: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}
      >
        <span>© 2026 NexusChat. All rights reserved.</span>

        {/* Social links */}
        <div className="flex items-center gap-5">
          {["GitHub", "Twitter", "Discord", "LinkedIn"].map((s) => (
            <a key={s} href={`#${s.toLowerCase()}`} className="hover:text-white transition-colors">
              {s}
            </a>
          ))}
        </div>

        {/* Legal */}
        <div className="flex items-center gap-5">
          <a href="#privacy" className="hover:text-white transition-colors">Riêng tư</a>
          <a href="#terms" className="hover:text-white transition-colors">Điều khoản</a>
        </div>
      </div>
    </footer>
  );
};
