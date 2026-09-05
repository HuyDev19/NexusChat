import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, Star, Wifi } from "lucide-react";
import api from "@/lib/axios";

import imgDark from "../../assets/app-dark.png";
import imgCall from "../../assets/app-call.png";
import imgLight from "../../assets/app-light.png";
import imgAI from "../../assets/app-ai.png";
import imgStory from "../../assets/app-story.png";
import imgEditor from "../../assets/app-editor.png";

const SLIDES = [
  {
    heading1: "Bảo Mật.",
    heading2: "Riêng Tư.",
    heading3: "Tuyệt Đối.",
    title: "Chế Độ Tối Tuyệt Đẹp",
    tagline: "Giao diện Dark Mode tinh tế, giảm mỏi mắt khi làm việc ban đêm.",
    image: imgDark,
  },
  {
    heading1: "Kết Nối.",
    heading2: "Mọi Lúc.",
    heading3: "Mọi Nơi.",
    title: "Gọi Video Nhóm HD",
    tagline: "Trò chuyện mặt đối mặt mượt mà, không giới hạn khoảng cách.",
    image: imgCall,
  },
  {
    heading1: "Đơn Giản.",
    heading2: "Nhanh Chóng.",
    heading3: "Hiệu Quả.",
    title: "Giao Diện Sáng Tối Ưu",
    tagline: "Thiết kế không độ trễ, tập trung tối đa vào nội dung hội thoại.",
    image: imgLight,
  },
  {
    heading1: "Thông Minh.",
    heading2: "Thân Thiện.",
    heading3: "Đắc Lực.",
    title: "Trợ Lý NexusAI",
    tagline: "Thông minh, lầy lội. Trợ lý đắc lực giải đáp mọi thắc mắc ngay trong khung chat.",
    image: imgAI,
  },
  {
    heading1: "Chia Sẻ.",
    heading2: "Cảm Xúc.",
    heading3: "Mỗi Ngày.",
    title: "Khoảnh Khắc Story 24h",
    tagline: "Cập nhật và chia sẻ nhanh trạng thái với bạn bè theo thời gian thực.",
    image: imgStory,
  },
  {
    heading1: "Sáng Tạo.",
    heading2: "Khác Biệt.",
    heading3: "Cá Tính.",
    title: "Công Cụ Chỉnh Ảnh",
    tagline: "Bộ lộc màu, vẽ tay, lật xoay và cắt ảnh đa năng ngay trong khung chat.",
    image: imgEditor,
  },
];

interface ReviewStat {
  averageRating: number;
  totalReviews: number;
  recentAvatars: { name: string; avatar: string | null }[];
}

// Generate 30 uptime bars (simulated, mostly green with occasional gap)
const UPTIME_BARS = Array.from({ length: 30 }, (_, i) =>
  i === 7 || i === 22 ? "gap" : "ok"
);

function useInView(threshold = 0.2) {
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

export const TrustSection = () => {
  const { ref, visible } = useInView(0.15);
  const [slideIndex, setSlideIndex] = useState(0);
  const [wordReveal, setWordReveal] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStat | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const slide = SLIDES[slideIndex];

  // Measure real ping to backend
  useEffect(() => {
    const measure = async () => {
      const start = performance.now();
      try {
        await api.get("/users/count");
        setPing(Math.round(performance.now() - start));
      } catch {
        setPing(null);
      }
    };
    measure();
  }, []);

  // Fetch real review stats
  useEffect(() => {
    api.get("/reviews/stats").then(res => {
      if (res.data?.success) setReviewStats(res.data);
    }).catch(() => {});
  }, []);

  // Re-trigger word reveal on slide change
  useEffect(() => {
    if (!visible) return;
    setWordReveal(false);
    const t = setTimeout(() => setWordReveal(true), 60);
    return () => clearTimeout(t);
  }, [slideIndex, visible]);

  // Auto-play timer
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setSlideIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [slideIndex, visible]);

  useEffect(() => {
    if (visible) setWordReveal(true);
  }, [visible]);

  const prev = () => setSlideIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlideIndex((i) => (i + 1) % SLIDES.length);

  // 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -8; // Max rotation 8deg
    const rotateY = ((x - centerX) / centerX) * 8;
    
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <section
      id="trust"
      ref={ref as React.RefObject<HTMLElement>}
      className="relative bg-white dark:bg-background py-20 sm:py-28 px-6 sm:px-10 mt-3 rounded-[2rem]"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        
        {/* Left Column: Typography & Controls */}
        <div className="flex flex-col gap-10">
          {/* Top badge row */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4">

            {/* Card 1 — Live Server Status */}
            <div
              className="group flex-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 cursor-default
                backdrop-blur-md bg-white/70 dark:bg-white/5
                border border-white/80 dark:border-white/10
                shadow-sm hover:shadow-md hover:border-green-400/40 dark:hover:border-green-500/30
                transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1) 50ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 50ms, box-shadow 0.3s, border-color 0.3s",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">Đang hoạt động</span>
                </div>
                <Wifi className="w-3.5 h-3.5 text-slate-300 dark:text-white/20 group-hover:text-green-400 transition-colors" />
              </div>

              {/* Uptime bars — 30 days */}
              <div className="flex items-end gap-[2px]" title="Uptime 30 ngày qua">
                {UPTIME_BARS.map((status, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-[2px] transition-all duration-200"
                    style={{
                      height: status === "ok" ? "16px" : "10px",
                      background: status === "ok"
                        ? "linear-gradient(to top, #22c55e, #4ade80)"
                        : "#f87171",
                      opacity: status === "ok" ? 0.85 : 0.6,
                    }}
                  />
                ))}
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-3 text-[0.65rem] text-slate-500 dark:text-white/50 font-medium">
                <span>
                  Ping:{" "}
                  <span className="text-slate-800 dark:text-white font-bold">
                    {ping !== null ? `~${ping}ms` : "..."}
                  </span>
                </span>
                <span className="w-0.5 h-3 rounded-full bg-slate-200 dark:bg-white/10" />
                <span>
                  E2EE:{" "}
                  <span className="text-green-600 dark:text-green-400 font-bold">Đã bật</span>
                </span>
                <span className="w-0.5 h-3 rounded-full bg-slate-200 dark:bg-white/10" />
                <span>
                  30d:{" "}
                  <span className="text-slate-800 dark:text-white font-bold">99.3%</span>
                </span>
              </div>
            </div>

            {/* Card 2 — Social Proof */}
            <article
              className="group flex-1 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 cursor-pointer
                backdrop-blur-md bg-white/70 dark:bg-white/5
                border border-white/80 dark:border-white/10
                shadow-sm hover:shadow-md hover:border-amber-400/40 dark:hover:border-amber-500/30
                transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1) 120ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 120ms, box-shadow 0.3s, border-color 0.3s",
              }}
              onClick={() => document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" })}
            >
              {/* Stars + score */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5 shrink-0"
                    style={{
                      fill: (reviewStats?.averageRating ?? 4.9) >= s ? "#f59e0b" : "transparent",
                      color: (reviewStats?.averageRating ?? 4.9) >= s ? "#f59e0b" : "#d1d5db",
                    }}
                  />
                ))}
                <span className="text-sm font-bold text-slate-900 dark:text-white ml-1">
                  {reviewStats?.averageRating ? `${reviewStats.averageRating}/5` : "4.9/5"}
                </span>
                {reviewStats?.totalReviews ? (
                  <span className="text-[0.6rem] text-slate-400 dark:text-white/30 ml-1">
                    ({reviewStats.totalReviews})
                  </span>
                ) : null}
              </div>

              {/* Avatars + text */}
              <div className="flex items-center gap-2.5">
                <div className="flex -space-x-2 shrink-0">
                  {(reviewStats?.recentAvatars?.slice(0, 3) ?? []).length > 0
                    ? reviewStats!.recentAvatars.slice(0, 3).map((u, i) =>
                        u.avatar ? (
                          <img key={i} src={u.avatar} alt={u.name}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white dark:ring-background" />
                        ) : (
                          <div key={i}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 ring-2 ring-white dark:ring-background flex items-center justify-center text-[0.5rem] font-bold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )
                      )
                    : ["#7c3aed", "#f59e0b", "#10b981"].map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-background"
                          style={{ background: c }} />
                      ))
                  }
                </div>
                <p className="text-[0.65rem] text-slate-500 dark:text-white/50 leading-tight">
                  Cùng hàng ngàn<br />thành viên mỗi ngày.
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1 text-[0.65rem] font-semibold text-primary/70 group-hover:text-primary transition-colors">
                Xem tất cả đánh giá
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </article>
          </div>

          {/* Heading */}
          <div 
            className="flex flex-col justify-center" 
            style={{ height: "clamp(12rem, 30vw, 24rem)" }}
          >
            {[slide.heading1, slide.heading2, slide.heading3].map((line, wi) => (
                <span
                  key={wi + line}
                  className={`block font-extrabold uppercase tracking-tight leading-[1.15] ${wi === 1 ? "text-primary" : "text-slate-900 dark:text-white"}`}
                  style={{
                    fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
                    opacity: wordReveal ? 1 : 0,
                    transform: wordReveal ? "translateX(0)" : "translateX(-60px)",
                    filter: wordReveal ? "blur(0px)" : "blur(8px)",
                    transition: wordReveal
                      ? `all 0.8s cubic-bezier(0.16,1,0.3,1) ${wi * 120}ms`
                      : "none",
                  }}
                >
                  {line}
                </span>
            ))}
          </div>

          {/* Carousel controls - Progress Bars */}
          <div className="flex items-center gap-4 mt-8">
            <style>{`
              @keyframes slideProgress {
                from { transform: scaleX(0); }
                to { transform: scaleX(1); }
              }
            `}</style>
            {SLIDES.map((_, i) => {
              const isActive = i === slideIndex;
              return (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className="relative h-1.5 w-16 sm:w-20 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                  aria-label={`Chuyển đến slide ${i + 1}`}
                >
                  {/* Progress Fill */}
                  {isActive && (
                    <div
                      key={slideIndex} // Remounts to restart animation
                      className="absolute inset-0 bg-primary origin-left"
                      style={{
                        animation: "slideProgress 5s linear forwards",
                      }}
                    />
                  )}
                  {/* Optionally, if you want previous slides to stay filled: */}
                  {/* {i < slideIndex && <div className="absolute inset-0 bg-primary" />} */}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Professional Chat Mockup */}
        <div className="relative w-full flex flex-col items-center justify-center pointer-events-auto group gap-6 mt-4 lg:mt-0">
          <div className="relative w-full aspect-video">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 blur-[100px] rounded-full transition-colors duration-500" />
            
            <figure
              className="w-full h-full max-w-2xl mx-auto rounded-2xl sm:rounded-[2rem] overflow-visible relative"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 200ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) 200ms",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* 3D Container */}
            <div 
               ref={cardRef} 
               className="w-full h-full relative transition-transform duration-200 ease-out shadow-2xl shadow-primary/20 dark:shadow-black/50 border border-black/5 dark:border-white/10 rounded-2xl sm:rounded-[2rem] overflow-hidden" 
               style={{ transformStyle: 'preserve-3d' }}
            >
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" 
              />
              
              </div>
            </figure>
          </div>
          
          {/* Caption below the image */}
          <div 
            className="w-full max-w-2xl mx-auto rounded-2xl p-4 sm:p-5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm flex items-center justify-between transition-all duration-500"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 300ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) 300ms",
            }}
          >
            <div className="min-w-0 pr-4">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{slide.title}</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-1 line-clamp-2">{slide.tagline}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
