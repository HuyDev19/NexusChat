import { useEffect, useRef, useState } from "react";

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

/** Mock Dark Mode chat UI */
const DarkModeUI = () => (
  <div className="w-full h-full flex" style={{ background: "#0f172a", minHeight: "200px" }}>
    {/* Sidebar */}
    <div className="w-14 sm:w-16 flex flex-col gap-2 p-2 border-r border-white/5">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="w-8 h-8 rounded-xl mx-auto" style={{ background: i === 0 ? "#7c3aed" : "rgba(255,255,255,0.08)" }} />
      ))}
    </div>
    {/* Chat list */}
    <div className="w-32 sm:w-40 flex flex-col gap-1.5 p-2 border-r border-white/5">
      {[28, 20, 32, 16, 24].map((w, i) => (
        <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded-lg" style={{ background: i === 0 ? "rgba(124,58,237,0.2)" : "transparent" }}>
          <div className="w-6 h-6 rounded-full shrink-0" style={{ background: i === 0 ? "#7c3aed" : "rgba(255,255,255,0.12)" }} />
          <div className="h-2 rounded-full flex-1 max-w-[4rem]" style={{ background: "rgba(255,255,255,0.15)", width: `${w}px` }} />
        </div>
      ))}
    </div>
    {/* Message area */}
    <div className="flex-1 flex flex-col gap-2 p-3">
      <div className="flex justify-start"><div className="h-5 w-24 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }} /></div>
      <div className="flex justify-end"><div className="h-5 w-16 rounded-xl" style={{ background: "#7c3aed" }} /></div>
      <div className="flex justify-start"><div className="h-5 w-32 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }} /></div>
      <div className="flex justify-end"><div className="h-5 w-20 rounded-xl" style={{ background: "#7c3aed" }} /></div>
      <div className="mt-auto h-6 rounded-full" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.06)" }} />
    </div>
  </div>
);

/** Mock Light Mode chat UI */
const LightModeUI = () => (
  <div className="w-full h-full flex" style={{ background: "#f8fafc", minHeight: "200px" }}>
    {/* Sidebar */}
    <div className="w-14 sm:w-16 flex flex-col gap-2 p-2 border-r border-black/5">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="w-8 h-8 rounded-xl mx-auto" style={{ background: i === 0 ? "#7c3aed" : "rgba(0,0,0,0.06)" }} />
      ))}
    </div>
    {/* Chat list */}
    <div className="w-32 sm:w-40 flex flex-col gap-1.5 p-2 border-r border-black/5">
      {[28, 20, 32, 16, 24].map((w, i) => (
        <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded-lg" style={{ background: i === 0 ? "rgba(124,58,237,0.08)" : "transparent" }}>
          <div className="w-6 h-6 rounded-full shrink-0" style={{ background: i === 0 ? "#7c3aed" : "rgba(0,0,0,0.1)" }} />
          <div className="h-2 rounded-full flex-1 max-w-[4rem]" style={{ background: "rgba(0,0,0,0.1)", width: `${w}px` }} />
        </div>
      ))}
    </div>
    {/* Message area */}
    <div className="flex-1 flex flex-col gap-2 p-3">
      <div className="flex justify-start"><div className="h-5 w-24 rounded-xl" style={{ background: "rgba(0,0,0,0.06)" }} /></div>
      <div className="flex justify-end"><div className="h-5 w-16 rounded-xl" style={{ background: "#7c3aed" }} /></div>
      <div className="flex justify-start"><div className="h-5 w-32 rounded-xl" style={{ background: "rgba(0,0,0,0.06)" }} /></div>
      <div className="flex justify-end"><div className="h-5 w-20 rounded-xl" style={{ background: "#7c3aed" }} /></div>
      <div className="mt-auto h-6 rounded-full" style={{ background: "white", border: "1px solid rgba(0,0,0,0.08)" }} />
    </div>
  </div>
);

const APP_CARDS = [
  {
    label: "Chế độ tối",
    desc: "Giao diện tối tinh tế cho đêm tập trung.",
    captionBg: "rgba(15,10,63,0.55)",
    UI: DarkModeUI,
  },
  {
    label: "Chế độ sáng",
    desc: "Sáng sạch và rõ ràng cho công việc ban ngày.",
    captionBg: "rgba(11,110,151,0.55)",
    UI: LightModeUI,
  },
];

export const AppUISection = () => {
  const { ref, visible } = useInView(0.15);

  return (
    <section
      id="app-ui"
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-white dark:bg-background rounded-[2rem] -mt-10 px-6 sm:px-10 pt-16 pb-20"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
          {/* Intro column */}
          <div className="max-w-sm">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.85)",
                transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>

            {/* Stacked lines heading */}
            <div className="mt-6">
              {["Trải Nghiệm", "Giao Diện", "Tốt Nhất"].map((line, i) => (
                <div key={line} className="line-clip">
                  <h2
                    className="text-5xl font-semibold leading-[1.15] tracking-tight text-slate-900 dark:text-white"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(115%)",
                      transition: `opacity 0.95s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms, transform 0.95s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`,
                    }}
                  >
                    {line}
                  </h2>
                </div>
              ))}
            </div>

            {/* Body copy — word fade */}
            <p
              className="mt-6 text-sm text-muted-foreground max-w-xs leading-relaxed"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(18px)",
                transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1) 250ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) 250ms",
              }}
            >
              Thiết kế tập trung, chọn Light hay Dark bằng một cú click. Không bao giờ bỏ lỡ tin nhắn quan trọng.
            </p>
          </div>

          {/* App UI cards */}
          <div className="flex items-end gap-5">
            {APP_CARDS.map((card, i) => {
              return (
                <figure
                  key={card.label}
                  className="flex-1 rounded-2xl overflow-hidden relative group cursor-default bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                  style={{
                    aspectRatio: "3/4",
                    marginBottom: i === 1 ? "2rem" : 0,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(48px)",
                    transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 140}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 140}ms`,
                  }}
                >
                  {/* Mock UI fills the card */}
                  <div
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ transformOrigin: "center" }}
                  >
                    <card.UI />
                  </div>
                  {/* Glass caption */}
                  <figcaption
                    className="absolute inset-x-3 bottom-3 rounded-xl px-4 py-3 backdrop-blur-md"
                    style={{ background: card.captionBg }}
                  >
                    <p className="text-sm font-medium text-white">{card.label}</p>
                    <p className="text-[0.65rem] text-white/80">{card.desc}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
