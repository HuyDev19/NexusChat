import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { ArrowRight, Github, Mail, ExternalLink, Lightbulb } from "lucide-react";

interface FooterProps {
  onOpenFeedback: () => void;
}

const TEAM = [
  {
    name: "Leader: Huỳnh Nhất Huy",
    role: "Đóng góp: Kiến trúc, Auth, Real-time & AI",
    github: "https://github.com/HuyDev19",
    username: "HuyDev19",
  },
  {
    name: "Đoàn Phan Vĩnh Phú",
    role: "Đóng góp: Giao diện & Trải nghiệm người dùng",
    github: "https://github.com/VinhPhus",
    username: "VinhPhus",
  },
  {
    name: "Lê Nguyễn Nhật Duy",
    role: "Đóng góp: API, Cơ sở dữ liệu & Tích hợp",
    github: "https://github.com/NhatDuy-25",
    username: "NhatDuy-25",
  },
];

const NAV_COLS = [
  {
    heading: "Tính năng",
    links: [
      { label: "Tính năng nổi bật", href: "#trust", scroll: true },
      { label: "Bảo mật & Quyền riêng tư", href: "#features", scroll: true },
      { label: "Cập nhật mới nhất", href: "#changelog", scroll: true },
      { label: "Đánh giá người dùng", href: "#testimonials", scroll: true },
    ],
  },
  {
    heading: "Dự án",
    links: [
      { label: "GitHub Repository", href: "https://github.com/HuyDev19/NexusChat", scroll: false },
      { label: "Báo lỗi (Issues)", href: "https://github.com/HuyDev19/NexusChat/issues", scroll: false },
      { label: "Lộ trình phát triển", href: "#changelog", scroll: true },
      { label: "Đóng góp ý kiến", href: "#feedback", scroll: false, isFeedback: true },
    ],
  },
];

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export const Footer = ({ onOpenFeedback }: FooterProps) => {
  const { ref, visible } = useInView(0.1);

  const handleNavClick = (link: { href: string; scroll?: boolean; isFeedback?: boolean }) => {
    if (link.isFeedback) { onOpenFeedback(); return; }
    if (link.scroll) {
      const id = link.href.replace("#", "");
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.open(link.href, "_blank", "noopener,noreferrer");
    }
  };

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
          <div
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em]"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            <Lightbulb className="w-3.5 h-3.5 text-purple-300" />
            Góp ý & cải thiện
          </div>
          <div className="mt-4">
            {["Giúp chúng tôi", "cải thiện hơn."].map((line, i) => (
              <div key={line} className="line-clip">
                <p
                  className="text-5xl sm:text-6xl font-semibold leading-[0.92] tracking-tight text-white"
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
          <p
            className="mt-4 text-sm max-w-sm leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.6)",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 300ms",
            }}
          >
            Bạn có ý tưởng tính năng mới hoặc phát hiện lỗi? Gửi phản hồi trực tiếp đến nhóm phát triển.
          </p>
        </div>

        {/* CTA button */}
        <button
          onClick={onOpenFeedback}
          className="group inline-flex items-center gap-3 rounded-full bg-white text-indigo-950 text-sm font-semibold uppercase tracking-wide px-7 py-4 hover:bg-purple-100 transition-colors self-start sm:self-auto shrink-0"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 150ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 150ms",
          }}
        >
          <Lightbulb className="w-4 h-4" />
          Gửi góp ý
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10 py-14" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        {/* Brand column */}
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <PenguinIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-medium uppercase tracking-[0.2em] text-white">NexusChat</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Ứng dụng nhắn tin thời gian thực thế hệ mới, xây dựng bằng React, Node.js & Socket.IO.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Đồ án thực tế CNPM — DH GTVT TP.HCM 2026
          </div>
          <address className="mt-5 not-italic text-sm flex flex-col gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            <a
              href="mailto:nhathuyhuynh240@gmail.com"
              className="flex items-center gap-2 hover:text-white transition-colors w-fit"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              nhathuyhuynh240@gmail.com
            </a>
            <a
              href="https://github.com/HuyDev19/NexusChat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors w-fit"
            >
              <Github className="w-3.5 h-3.5 shrink-0" />
              github.com/HuyDev19/NexusChat
            </a>
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
                  <button
                    onClick={() => handleNavClick(link)}
                    className="text-sm text-left transition-colors hover:text-white flex items-center gap-1.5 group"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {link.label}
                    {!link.scroll && !link.isFeedback && (
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Team section */}
      <div className="py-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <h4
          className="text-xs font-medium uppercase tracking-[0.2em] mb-6"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Nhóm phát triển
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEAM.map((member, i) => (
            <a
              key={member.username}
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:bg-white/10"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms, background 0.2s`,
              }}
            >
              <img
                src={`https://avatars.githubusercontent.com/${member.username}`}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-purple-400/60 transition-all shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{member.name}</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{member.role}</p>
              </div>
              <Github className="w-4 h-4 ml-auto shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "rgba(255,255,255,0.8)" }} />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 text-sm"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        <span>© 2026 NexusChat — Đồ án thực tế CNPM, DH GTVT TP.HCM</span>

        <div className="flex items-center gap-5">
          <a
            href="https://github.com/HuyDev19/NexusChat"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub
          </a>
          <a href="#privacy" className="hover:text-white transition-colors">Riêng tư</a>
          <a href="#terms" className="hover:text-white transition-colors">Điều khoản</a>
        </div>
      </div>
    </footer>
  );
};
