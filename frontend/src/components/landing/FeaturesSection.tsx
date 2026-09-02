import React, { useEffect, useRef, useState } from "react";
import { ShieldAlert, LockKeyhole, Ghost, KeyRound, Bot, Fingerprint, EyeOff, FileKey2 } from "lucide-react";

function useInView(threshold = 0.15) {
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

const SECURITY_FEATURES = [
  {
    id: "ai-moderation",
    title: "AI Kiểm Duyệt",
    desc: "Tự động nhận diện và chặn đứng các tin nhắn rác, quảng cáo lừa đảo hoặc ngôn từ độc hại nhờ sức mạnh của Google Gemini AI, mang lại môi trường trò chuyện trong sạch.",
    icon: Bot,
    className: "md:col-span-2 md:row-span-1",
    visual: (
      <div className="relative w-full h-full min-h-[160px] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5" />
        <div className="relative z-10 flex flex-col gap-3 w-full max-w-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start gap-3 transform -rotate-1 hover:rotate-0 transition-transform">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
              <span className="text-rose-500 text-xs font-bold">Spam</span>
            </div>
            <div className="flex-1">
              <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-2 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm flex items-start gap-3 transform translate-x-4 rotate-1 hover:rotate-0 transition-transform">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-emerald-600 mb-1">AI Đã can thiệp</div>
              <div className="h-2 w-full bg-emerald-100 dark:bg-emerald-900/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "chat-lock",
    title: "Khóa Bằng Mã PIN",
    desc: "Bảo vệ tuyệt đối các cuộc hội thoại riêng tư. Tin nhắn bí mật sẽ được ẩn đi và chỉ có thể mở khóa bằng mã PIN của bạn.",
    icon: LockKeyhole,
    className: "md:col-span-1 md:row-span-2",
    visual: (
      <div className="relative w-full h-full min-h-[260px] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900/50" />
        <div className="relative z-10 w-full max-w-[280px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/10 rounded-2xl shadow-xl p-5 flex flex-col items-center group-hover:scale-105 transition-transform duration-500">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="w-8 h-8 text-purple-500" strokeWidth={2.5} />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1 text-center">Cuộc trò chuyện đã bị khóa</h4>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-5 text-center">Vui lòng nhập mã PIN để xem nội dung</p>
          
          <div className="w-full h-9 rounded-full border-2 border-purple-400 dark:border-purple-500/50 flex items-center justify-center mb-2.5">
            <span className="text-slate-400 text-xs">Mã PIN (VD: 1234)</span>
          </div>
          <div className="w-full h-9 rounded-full bg-purple-400 dark:bg-purple-500 flex items-center justify-center gap-1.5 text-white">
            <span className="text-xs font-semibold">Mở khóa</span>
            <LockKeyhole className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    )
  },
  {
    id: "incognito",
    title: "Chế Độ Ẩn Danh",
    desc: "Gửi ảnh/video xem một lần (View Once). Dữ liệu sẽ bốc hơi hoàn toàn không để lại dấu vết.",
    icon: Ghost,
    className: "md:col-span-1 md:row-span-1",
    visual: (
      <div className="relative w-full h-full min-h-[220px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1e1e24] group-hover:bg-[#16161a] transition-colors duration-500" />
        
        {/* Top bar mockup */}
        <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 flex items-center px-3 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Ghost className="w-3.5 h-3.5 text-white/50" />
            </div>
            <span className="text-rose-500 text-[10px] font-bold flex items-center gap-1">
              <Ghost className="w-3 h-3" /> Chat Ẩn Danh
            </span>
          </div>
          <div className="px-2 py-0.5 rounded-full border border-rose-500/30 text-rose-500 text-[9px] flex items-center gap-1">
            <EyeOff className="w-2.5 h-2.5" /> Tắt khẩn cấp
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center mt-4 transform group-hover:scale-110 transition-transform duration-700">
          <Ghost className="w-12 h-12 text-rose-500 mb-3 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
          <h4 className="font-bold text-white text-[15px] mb-1">Chat Ẩn Danh Đang Bật</h4>
          <p className="text-slate-400 text-[10px]">Nội dung đã bị ẩn để bảo vệ quyền riêng tư.</p>
        </div>

        {/* Bottom bar mockup */}
        <div className="absolute bottom-3 left-3 right-3 h-9 rounded-full bg-white/5 border border-white/5 flex items-center px-3 gap-2">
          <span className="text-white/30 text-[10px] flex-1">Soạn tin nhắn...</span>
          <div className="w-5 h-5 rounded-full bg-purple-500/80 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current" ><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "data-protection",
    title: "Mã Hóa Dữ Liệu",
    desc: "Mọi thông tin cá nhân và phiên đăng nhập đều được mã hóa nhiều lớp theo chuẩn an toàn cao nhất (Bcrypt & JWT).",
    icon: FileKey2,
    className: "md:col-span-2 md:row-span-1",
    visual: (
      <div className="relative w-full h-full min-h-[160px] flex items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="font-mono text-xs text-emerald-500/70 whitespace-pre leading-relaxed group-hover:text-emerald-400 transition-colors">
            {`> ENCRYPTING PAYLOAD...
> eyJhbGciOiJIUzI1NiIsInR...
> SECURE CONNECTION ESTABLISHED.
> STATUS: 200 OK`}
          </div>
        </div>
      </div>
    )
  }
];

const BentoCard = ({ feature }: { feature: typeof SECURITY_FEATURES[0] }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-8 flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 ${feature.className}`}
    >
      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(120,119,198,0.15), transparent 40%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shrink-0">
          <feature.icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-slate-900 dark:text-white tracking-tight">
          {feature.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
          {feature.desc}
        </p>

        <div className="mt-auto w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
          {feature.visual}
        </div>
      </div>
    </div>
  );
};

export const FeaturesSection = () => {
  const { ref, visible } = useInView(0.15);

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-24 px-6 sm:px-10 bg-slate-50 dark:bg-background overflow-hidden relative"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse" />
            Bảo mật & Quyền riêng tư
          </div>
          
          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            Quyền riêng tư của bạn là <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">ưu tiên số 1</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(0,1fr)]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          {SECURITY_FEATURES.map((feature) => (
            <BentoCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};
