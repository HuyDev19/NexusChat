import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  Bot,
  Phone,
  Lock,
  FileImage,
  MessageSquareText,
  Radio,
  CalendarClock,
  Mic,
  ShieldCheck,
  Layers,
  Globe,
  BellRing,
  StickerIcon,
  Fingerprint,
  QrCode,
  Smartphone,
} from "lucide-react";

type Status = "released" | "coming";

interface ChangelogItem {
  id: string;
  version?: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  status: Status;
  highlight?: boolean;
  date?: string;
}

const CHANGELOG: ChangelogItem[] = [
  // --- Released ---
  {
    id: "nexusai",
    version: "v1.5",
    label: "Trợ lý NexusAI",
    desc: "Gọi @NexusAI trong chat để hỏi đáp, tóm tắt cuộc trò chuyện bằng Gemini AI.",
    icon: Bot,
    status: "released",
    highlight: true,
    date: "Tháng 8, 2026",
  },
  {
    id: "video-call",
    version: "v1.4",
    label: "Gọi Video & Âm thanh HD",
    desc: "Cuộc gọi 1:1 và nhóm chất lượng cao qua LiveKit SFU với lọc tiếng ồn AI (Krisp).",
    icon: Phone,
    status: "released",
    date: "Tháng 7, 2026",
  },
  {
    id: "chat-lock",
    version: "v1.3",
    label: "Khóa chat bằng PIN",
    desc: "Bảo vệ các cuộc trò chuyện nhạy cảm bằng mã PIN 4 chữ số.",
    icon: Lock,
    status: "released",
    date: "Tháng 6, 2026",
  },
  {
    id: "view-once",
    version: "v1.3",
    label: "Media xem một lần",
    desc: "Ảnh & video tự xóa sau khi đối phương xem, đảm bảo quyền riêng tư tuyệt đối.",
    icon: FileImage,
    status: "released",
    date: "Tháng 6, 2026",
  },
  {
    id: "channels",
    version: "v1.4",
    label: "Kênh công khai",
    desc: "Tạo và theo dõi các kênh phát sóng công khai, tìm kiếm và tham gia cộng đồng.",
    icon: Radio,
    status: "released",
    date: "Tháng 7, 2026",
  },
  {
    id: "scheduled",
    version: "v1.5",
    label: "Tin nhắn hẹn giờ",
    desc: "Lên lịch gửi tin nhắn tự động vào thời điểm bạn muốn.",
    icon: CalendarClock,
    status: "released",
    date: "Tháng 8, 2026",
  },
  {
    id: "voice-msg",
    version: "v1.4",
    label: "Tin nhắn thoại & Chuyển giọng nói",
    desc: "Ghi âm trực tiếp trong chat, tự động chuyển đổi sang văn bản bằng AI.",
    icon: Mic,
    status: "released",
    date: "Tháng 7, 2026",
  },
  {
    id: "ai-mod",
    version: "v1.5",
    label: "AI kiểm duyệt nội dung",
    desc: "Tự động chặn spam, lừa đảo và ngôn từ độc hại bằng Gemini AI.",
    icon: ShieldCheck,
    status: "released",
    date: "Tháng 8, 2026",
  },
  {
    id: "translation",
    version: "v1.5",
    label: "Dịch tin nhắn tức thì",
    desc: "Dịch nội dung chat sang nhiều ngôn ngữ ngay trong ứng dụng.",
    icon: Globe,
    status: "released",
    date: "Tháng 8, 2026",
  },
  {
    id: "rich-text",
    version: "v1.3",
    label: "Văn bản phong phú & Markdown",
    desc: "Hỗ trợ in đậm, nghiêng, danh sách, code block trong tin nhắn.",
    icon: MessageSquareText,
    status: "released",
    date: "Tháng 6, 2026",
  },

  // --- Coming Soon ---
  {
    id: "stickers",
    label: "Kho Sticker & GIF",
    desc: "Thư viện sticker và GIF phong phú giúp cuộc trò chuyện thêm sinh động.",
    icon: StickerIcon,
    status: "coming",
    highlight: true,
  },
  {
    id: "2fa",
    label: "Xác thực 2 lớp (2FA)",
    desc: "Tăng cường bảo mật tài khoản bằng mã OTP qua ứng dụng xác thực.",
    icon: Fingerprint,
    status: "coming",
  },
  {
    id: "story",
    version: "v1.5",
    label: "Story 24h",
    desc: "Chia sẻ khoảnh khắc với bạn bè, tự động biến mất sau 24 giờ. Đang trong giai đoạn hoàn thiện.",
    icon: Layers,
    status: "released",
    date: "Đang phát triển — 2026",
  },
  {
    id: "notifications",
    label: "Thông báo email & push",
    desc: "Nhận thông báo tin nhắn bị bỏ lỡ qua email và thông báo đẩy trên thiết bị.",
    icon: BellRing,
    status: "coming",
  },
  {
    id: "qr-login",
    label: "Đăng nhập bằng QR Code",
    desc: "Quét mã QR để đăng nhập nhanh trên thiết bị mới, không cần nhập mật khẩu.",
    icon: QrCode,
    status: "coming",
  },
  {
    id: "mobile-app",
    label: "Ứng dụng di động",
    desc: "Ứng dụng native cho iOS & Android với trải nghiệm mượt mà và thông báo tức thời.",
    icon: Smartphone,
    status: "coming",
    highlight: true,
  },
  {
    id: "search-global",
    label: "Tìm kiếm toàn cục",
    desc: "Tìm kiếm tin nhắn, tệp và liên hệ trên tất cả các cuộc trò chuyện cùng lúc.",
    icon: Zap,
    status: "coming",
  },
];

function useInView(threshold = 0.15) {
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

const StatusBadge = ({ status }: { status: Status }) =>
  status === "released" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-2.5 py-0.5">
      <CheckCircle2 className="w-3 h-3" /> Đã ra mắt
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-2.5 py-0.5">
      <Clock className="w-3 h-3" /> Sắp ra mắt
    </span>
  );

const ChangelogCard = ({
  item,
  visible,
  index,
}: {
  item: ChangelogItem;
  visible: boolean;
  index: number;
}) => {
  const Icon = item.icon;
  const isReleased = item.status === "released";

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms`,
      }}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        item.highlight
          ? "border-primary/30 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 hover:shadow-primary/10"
          : isReleased
          ? "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:shadow-slate-200/80 dark:hover:shadow-black/30"
          : "border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/3 hover:border-amber-300 dark:hover:border-amber-500/40 hover:shadow-amber-100/80 dark:hover:shadow-black/30"
      }`}
    >
      {/* Spotlight glow for highlight */}
      {item.highlight && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/8 to-transparent" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
            isReleased
              ? "bg-primary/10 text-primary"
              : "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
            {item.label}
          </h3>
          {item.version && (
            <span className="text-[10px] font-mono font-bold text-primary/70 dark:text-primary/60 bg-primary/8 dark:bg-primary/15 rounded px-1.5 py-0.5">
              {item.version}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {item.desc}
        </p>
      </div>

      {item.date && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-auto pt-2 border-t border-slate-100 dark:border-white/5">
          {item.date}
        </p>
      )}
    </div>
  );
};

export const ChangelogSection = () => {
  const { ref, visible } = useInView(0.1);
  const [activeTab, setActiveTab] = useState<Status>("released");

  const filtered = CHANGELOG.filter((c) => c.status === activeTab);
  const releasedCount = CHANGELOG.filter((c) => c.status === "released").length;
  const comingCount = CHANGELOG.filter((c) => c.status === "coming").length;

  return (
    <section
      id="changelog"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-24 px-6 sm:px-10 bg-white dark:bg-background relative overflow-hidden"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-primary/5 dark:bg-primary/8 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/5 dark:bg-indigo-500/8 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div
          className="text-center mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary mb-5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Cập nhật & Lộ trình
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
            Chúng tôi không ngừng{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
              cải tiến
            </span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Theo dõi những tính năng mới nhất đã được ra mắt và những gì sắp đến với NexusChat.
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex justify-center mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
            {(["released", "coming"] as Status[]).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === "released" ? releasedCount : comingCount;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  }`}
                >
                  {tab === "released" ? (
                    <CheckCircle2 className={`w-4 h-4 ${isActive ? "text-emerald-500" : ""}`} />
                  ) : (
                    <Clock className={`w-4 h-4 ${isActive ? "text-amber-500" : ""}`} />
                  )}
                  {tab === "released" ? "Đã ra mắt" : "Sắp ra mắt"}
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? tab === "released"
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <ChangelogCard key={item.id} item={item} visible={visible} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-14 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 0.4s",
          }}
        >
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Có ý tưởng tính năng mới?{" "}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-primary hover:underline font-semibold"
            >
              Gửi phản hồi cho chúng tôi →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
