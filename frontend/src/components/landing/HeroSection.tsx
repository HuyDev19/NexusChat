import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { ArrowRight, MessageCircleCode, Zap, ShieldCheck, Globe } from "lucide-react";
import { MarqueeTicker } from "./MarqueeTicker";

interface HeroSectionProps {
  loaderDone: boolean;
  onOpenContact: () => void;
}

// Feature slider data
const SLIDES = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-white" />,
    iconBg: "from-purple-600 to-indigo-600",
    category: "NexusChat Pro",
    name: "Mã hoá đầu cuối",
    cta: "Tìm hiểu thêm",
  },
  {
    icon: <Zap className="w-5 h-5 text-white" />,
    iconBg: "from-indigo-500 to-cyan-500",
    category: "NexusChat Calls",
    name: "Video & Thoại HD",
    cta: "Dùng miễn phí",
  },
  {
    icon: <Globe className="w-5 h-5 text-white" />,
    iconBg: "from-pink-500 to-purple-600",
    category: "NexusChat Teams",
    name: "Kênh nhóm toàn cầu",
    cta: "Khám phá nhóm",
  },
];

// Avatar dot colors for users card
const AVATAR_COLORS = ["#7c3aed", "#c2e029", "#0b6e97", "#ffffff"];

/** Word-by-word clip reveal hero title */
const AnimatedTitle = ({ ready }: { ready: boolean }) => {
  const line1 = "NEXUSCHAT".split("");
  const line2 = ["Nơi", "câu", "chuyện", "bắt", "đầu"];
  return (
    <div className="flex flex-col gap-1 sm:gap-2 select-none">
      {/* Line 1: NEXUSCHAT - Letter by letter */}
      <h1 className="font-bold tracking-tighter text-slate-900 dark:text-white leading-[1.1]"
        style={{ fontSize: "clamp(3.5rem, 12vw, 11rem)", letterSpacing: "-0.04em", display: "flex", flexWrap: "wrap" }}
      >
        {line1.map((char, i) => (
          <span key={i} className="word-clip" style={{ marginRight: char === " " ? "0.25em" : "0.01em" }}>
            <span
              style={{
                display: "inline-block",
                opacity: ready ? 1 : 0,
                transform: ready ? "translateY(0)" : "translateY(115%)",
                transition: ready
                  ? `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms`
                  : "none",
              }}
            >
              {char}
            </span>
          </span>
        ))}
      </h1>
      {/* Line 2: Nơi câu chuyện bắt đầu - Word by word */}
      <h2 className="font-semibold tracking-tight text-slate-700 dark:text-white/90 leading-[1.15]"
        style={{ fontSize: "clamp(2rem, 7vw, 6rem)", display: "flex", flexWrap: "wrap" }}
      >
        {line2.map((word, i) => (
          <span key={i} className="word-clip" style={{ marginRight: "0.25em" }}>
            <span
              style={{
                display: "inline-block",
                opacity: ready ? 1 : 0,
                transform: ready ? "translateY(0)" : "translateY(115%)",
                transition: ready
                  ? `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${line1.length * 70 + i * 120}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${line1.length * 70 + i * 120}ms`
                  : "none",
              }}
            >
              {word}
            </span>
          </span>
        ))}
      </h2>
    </div>
  );
};

/** Stacked lines tagline */
const TaglineLines = ({ ready }: { ready: boolean }) => {
  const lines = ["Giao tiếp liền mạch,", "Đồng bộ tức thì."];
  return (
    <div className="flex flex-col">
      {lines.map((line, i) => (
        <div key={line} className="line-clip">
          <span
            className="block font-semibold text-slate-600 dark:text-white/85 leading-[1.15] tracking-tight"
            style={{
              fontSize: "clamp(1.4rem, 2.4rem, 3rem)",
              opacity: ready ? 1 : 0,
              transform: ready ? "translateY(0)" : "translateY(115%)",
              transition: ready
                ? `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${400 + i * 110}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${400 + i * 110}ms`
                : "none",
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
};

export const HeroSection = ({ loaderDone, onOpenContact }: HeroSectionProps) => {
  const { accessToken } = useAuthStore();
  const [slideIndex, setSlideIndex] = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const [sliderVisible, setSliderVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gate hero bottom cards on loader
  useEffect(() => {
    if (!loaderDone) return;
    const t1 = setTimeout(() => setSliderVisible(true), 650);
    const t2 = setTimeout(() => setCardVisible(true), 780);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loaderDone]);

  // Feature slider autoplay
  useEffect(() => {
    if (!loaderDone) return;
    intervalRef.current = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % SLIDES.length);
    }, 3800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loaderDone]);

  const slide = SLIDES[slideIndex];

  return (
    <section
      className="relative isolate overflow-hidden flex flex-col rounded-[2rem] bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-100 dark:from-[#1e1b4b] dark:via-[#2d1f6e] dark:to-[#0f172a]"
      style={{
        height: "calc(100svh - 1rem)",
        minHeight: "36rem",
      }}
    >
      {/* Animated blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100">
        <div className="blob-drift-1 absolute w-[600px] h-[600px] rounded-full opacity-30 -top-24 -left-24"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(90px)" }} />
        <div className="blob-drift-2 absolute w-[400px] h-[400px] rounded-full opacity-25 -top-12 -right-12"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(80px)" }} />
        <div className="blob-drift-3 absolute w-[500px] h-[500px] rounded-full opacity-20 -bottom-24 left-1/2 -translate-x-1/2"
          style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)", filter: "blur(100px)" }} />
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-slate-200/50 dark:to-[#1e1b4b]/50" />

      {/* Header spacer — header is sticky on top of page, we just need a transparent area */}
      <div className="h-16 shrink-0" />

      {/* Title */}
      <div className="px-6 sm:px-10 pt-4">
        <AnimatedTitle ready={loaderDone} />
      </div>

      {/* Bottom row */}
      <div className="mt-auto px-6 sm:px-10 pb-8 sm:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          {/* Tagline */}
          <TaglineLines ready={loaderDone} />

          {/* Right cluster */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">

            {/* Feature slider — hidden on mobile */}
            <div
              className="hidden md:flex flex-col gap-3 w-64"
              style={{
                opacity: sliderVisible ? 1 : 0,
                transform: sliderVisible ? "translateY(0)" : "translateY(28px)",
                transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {/* Feature card */}
              <div
                className="flex items-center gap-3 rounded-2xl p-3 backdrop-blur-md bg-white/40 dark:bg-white/10 border border-black/5 dark:border-white/15 shadow-xl shadow-purple-900/10 dark:shadow-purple-950/40"
                key={slideIndex}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${slide.iconBg} flex items-center justify-center shrink-0`}
                >
                  {slide.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[0.65rem] font-medium uppercase tracking-wider text-slate-500 dark:text-white/70">{slide.category}</span>
                  <span className="text-[0.7rem] uppercase text-slate-800 dark:text-white/80 leading-tight mt-0.5">{slide.name}</span>
                  <span className="text-[0.6rem] text-primary dark:text-purple-300 underline underline-offset-2 mt-1 cursor-pointer hover:text-purple-700 dark:hover:text-white transition-colors">
                    {slide.cta} →
                  </span>
                </div>
              </div>

              {/* Dots */}
              <div className="flex items-center gap-2 px-1">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setSlideIndex(i); if (intervalRef.current) clearInterval(intervalRef.current); }}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === slideIndex ? "1.25rem" : "0.375rem",
                      background: i === slideIndex ? "var(--primary)" : "rgba(124,58,237,0.3)",
                    }}
                    aria-current={i === slideIndex}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Users card */}
            <article
              className="flex items-stretch gap-3 rounded-2xl p-3 backdrop-blur-md w-full sm:w-auto sm:max-w-[15rem] bg-white/40 dark:bg-white/10 border border-black/5 dark:border-white/15 shadow-xl shadow-purple-900/10 dark:shadow-purple-950/40"
              style={{
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? "translateY(0)" : "translateY(28px)",
                transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {/* Left column */}
              <div className="flex flex-col justify-between gap-2 flex-1">
                <span className="text-3xl font-semibold text-slate-900 dark:text-white leading-none">10M+</span>
                <div className="flex items-center">
                  {AVATAR_COLORS.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                      style={{
                        background: c,
                        marginLeft: i > 0 ? "-6px" : "0",
                      }}
                    />
                  ))}
                </div>
                <span className="text-[0.65rem] text-slate-600 dark:text-white/75">Người dùng hoạt động</span>
              </div>
              {/* Right: abstract avatar */}
              <div
                className="w-14 aspect-[3/4] rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                <MessageCircleCode className="w-7 h-7 text-white/80" />
              </div>
            </article>
          </div>
        </div>

        {/* CTA buttons — show when NOT logged in */}
        {!accessToken && (
          <div
            className="flex flex-col sm:flex-row items-center gap-4 mt-6"
            style={{
              opacity: loaderDone ? 1 : 0,
              transform: loaderDone ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 900ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 900ms",
            }}
          >
            <Link to="/signin">
              <button className="group h-12 px-7 flex items-center gap-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-indigo-950 text-sm font-semibold uppercase tracking-wide shadow-lg hover:bg-slate-800 dark:hover:bg-purple-100 transition-colors">
                Đăng nhập ngay
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button
              onClick={onOpenContact}
              className="h-12 px-7 rounded-full text-sm font-medium text-slate-700 dark:text-white/85 hover:text-slate-900 dark:hover:text-white uppercase tracking-wide border border-black/10 dark:border-white/20 hover:border-black/30 dark:hover:border-white/40 transition-colors backdrop-blur-sm bg-black/5 dark:bg-white/10"
            >
              Tìm hiểu thêm
            </button>
          </div>
        )}

        {accessToken && (
          <div className="mt-6"
            style={{
              opacity: loaderDone ? 1 : 0,
              transition: "opacity 0.7s 0.9s",
            }}
          >
            <Link to="/chat">
              <button className="group h-12 px-7 flex items-center gap-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-indigo-950 text-sm font-semibold uppercase tracking-wide hover:bg-slate-800 dark:hover:bg-purple-100 transition-colors">
                <MessageCircleCode className="w-4 h-4" />
                Mở ứng dụng chat
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Marquee at bottom */}
      <MarqueeTicker />
    </section>
  );
};
