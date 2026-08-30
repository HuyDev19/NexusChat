import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: "0ms", label: "Độ trễ gửi tin nhắn" },
  { value: "E2E", label: "Mã hoá mọi lúc" },
  { value: "10M+", label: "Tin nhắn mỗi ngày" },
  { value: "99.9%", label: "Uptime đảm bảo" },
];

function useInViewEl(threshold = 0.15) {
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

export const StatsSection = () => {
  const { ref, visible } = useInViewEl(0.2);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="rounded-[2rem] mt-3 px-6 sm:px-10 py-20 bg-slate-900 dark:bg-transparent dark:bg-gradient-to-br dark:from-[#1e1b4b] dark:via-[#2d1f6e] dark:to-[#1e1b4b]"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] mb-4"
          style={{ color: "rgba(255,255,255,0.65)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
          Con số thực tế
        </div>
        <div>
          {["Scale không giới hạn"].map((line, i) => (
            <div key={line} className="line-clip">
              <h2
                className="text-5xl font-semibold leading-[0.95] tracking-tight text-white"
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

        {/* Stats grid */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mt-16">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="pt-5"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.2)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 110}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 110}ms`,
              }}
            >
              <dd className="text-6xl sm:text-7xl font-semibold tracking-tight text-white leading-none">{stat.value}</dd>
              <dt className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
