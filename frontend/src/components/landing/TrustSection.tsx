import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

const SLIDES = [
  {
    heading1: "Liền Mạch.",
    heading2: "Mọi Lúc.",
    heading3: "Mọi Nơi.",
    company: "Dropship Co.",
    tagline: "2000+ thành viên từ xa",
    gradient: "from-purple-600 to-indigo-600",
    bgAccent: "#7c3aed",
  },
  {
    heading1: "Nhanh Hơn.",
    heading2: "Bảo Mật.",
    heading3: "Thông Minh.",
    company: "Launchpad Studio",
    tagline: "Đội ngũ sáng tạo toàn cầu",
    gradient: "from-indigo-600 to-cyan-600",
    bgAccent: "#4f46e5",
  },
  {
    heading1: "Tương Lai.",
    heading2: "Bắt Đầu.",
    heading3: "Hôm Nay.",
    company: "NovaTech Inc.",
    tagline: "Từ 5 lên đến 500 người",
    gradient: "from-pink-600 to-purple-600",
    bgAccent: "#a855f7",
  },
];

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

/** Mock chat UI card rendered in HTML/CSS (Straight, Professional) */
const MockChatCard = ({ gradient, bgAccent, company, tagline }: { gradient: string; bgAccent: string; company: string; tagline: string }) => (
  <div
    className={`w-full h-full bg-gradient-to-br ${gradient} p-4 sm:p-6 flex flex-col justify-between`}
    style={{ minHeight: "360px" }}
  >
    {/* Top bar */}
    <div className="flex items-center justify-between backdrop-blur-md bg-white/10 dark:bg-black/10 p-3 rounded-xl border border-white/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full" style={{ background: bgAccent, opacity: 0.9 }} />
        <div>
          <div className="h-2.5 w-24 rounded-full bg-white/90 mb-1.5" />
          <div className="h-2 w-16 rounded-full bg-white/60" />
        </div>
      </div>
      <ShieldCheck className="w-5 h-5 text-white/80" />
    </div>

    {/* Messages */}
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex justify-start">
        <div className="p-3 rounded-2xl rounded-tl-sm bg-white/20 backdrop-blur-sm border border-white/10 shadow-sm w-48">
          <div className="h-2 w-full rounded-full bg-white/80 mb-2" />
          <div className="h-2 w-2/3 rounded-full bg-white/80" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="p-3 rounded-2xl rounded-tr-sm w-40" style={{ background: bgAccent, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <div className="h-2 w-full rounded-full bg-white/90 mb-2" />
          <div className="h-2 w-1/2 rounded-full bg-white/90" />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="p-3 rounded-2xl rounded-tl-sm bg-white/20 backdrop-blur-sm border border-white/10 shadow-sm w-56">
          <div className="h-2 w-full rounded-full bg-white/80 mb-2" />
          <div className="h-2 w-3/4 rounded-full bg-white/80" />
        </div>
      </div>
    </div>

    {/* Input bar */}
    <div className="mt-8 h-12 rounded-full backdrop-blur-md bg-white/15 border border-white/20 flex items-center px-4">
      <div className="h-2 w-32 rounded-full bg-white/50" />
    </div>
  </div>
);

export const TrustSection = () => {
  const { ref, visible } = useInView(0.15);
  const [slideIndex, setSlideIndex] = useState(0);
  const [wordReveal, setWordReveal] = useState(false);

  const slide = SLIDES[slideIndex];

  // Re-trigger word reveal on slide change
  useEffect(() => {
    if (!visible) return;
    setWordReveal(false);
    const t = setTimeout(() => setWordReveal(true), 60);
    return () => clearTimeout(t);
  }, [slideIndex, visible]);

  useEffect(() => {
    if (visible) setWordReveal(true);
  }, [visible]);

  const prev = () => setSlideIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlideIndex((i) => (i + 1) % SLIDES.length);

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
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 flex flex-col items-center justify-center text-center gap-1 shrink-0"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.9)",
                transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <span className="text-xl font-bold text-primary">99.9%</span>
              <span className="text-[0.6rem] text-slate-500 dark:text-muted-foreground uppercase tracking-wider">Uptime</span>
            </div>

            <article
              className="flex-1 rounded-2xl bg-slate-50 dark:bg-white/5 p-4 sm:p-5 border border-slate-100 dark:border-white/10"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1) 120ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) 120ms",
              }}
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Tin dùng bởi các team thực sự</h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground leading-relaxed">
                Từ sinh viên đến đội ngũ 500 kỹ sư, NexusChat được chọn vì hiệu năng thực sự.
              </p>
            </article>
          </div>

          {/* Heading */}
          <div className="flex flex-col">
            {[slide.heading1, slide.heading2, slide.heading3].map((line, wi) => (
              <div key={wi + line} className="line-clip">
                <span
                  className={`block font-extrabold uppercase tracking-tight leading-[1.15] ${wi === 1 ? "text-primary" : "text-slate-900 dark:text-white"}`}
                  style={{
                    fontSize: "clamp(3.5rem, 8vw, 6rem)",
                    opacity: wordReveal ? 1 : 0,
                    transform: wordReveal ? "translateY(0)" : "translateY(115%)",
                    transition: wordReveal
                      ? `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${wi * 100}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${wi * 100}ms`
                      : "none",
                  }}
                >
                  {line}
                </span>
              </div>
            ))}
          </div>

          {/* Carousel controls */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/20 text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                aria-label="Slide trước"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-colors shadow-lg"
                aria-label="Slide tiếp theo"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            {/* Dots */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === slideIndex ? "1.5rem" : "0.5rem",
                    background: i === slideIndex ? "var(--primary)" : "rgba(124,58,237,0.2)",
                  }}
                  aria-current={i === slideIndex}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Professional Chat Mockup */}
        <div className="relative w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] flex items-center justify-center pointer-events-none">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-primary/10 dark:bg-primary/20 blur-[100px] rounded-full" />
          
          <figure
            className="w-full max-w-sm rounded-[2rem] overflow-hidden relative shadow-2xl shadow-primary/20 dark:shadow-black/50 border border-black/5 dark:border-white/10"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(40px)",
              transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 200ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) 200ms",
            }}
          >
            <MockChatCard gradient={slide.gradient} bgAccent={slide.bgAccent} company={slide.company} tagline={slide.tagline} />
            
            {/* Glass caption overlay */}
            <figcaption
              className="absolute bottom-4 left-4 right-4 rounded-2xl p-4 backdrop-blur-xl bg-black/40 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{slide.company}</p>
                  <p className="text-xs text-white/70 mt-0.5">{slide.tagline}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
            </figcaption>
          </figure>
        </div>

      </div>
    </section>
  );
};
