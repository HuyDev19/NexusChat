import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    index: "01",
    name: "Nhắn tin trực tiếp",
    desc: "Chat 1-1 thời gian thực với typing indicator và trạng thái đã đọc.",
    href: "#dm",
  },
  {
    index: "02",
    name: "Kênh & Nhóm",
    desc: "Tổ chức hội thoại theo chủ đề, dự án, và phòng ban.",
    href: "#channels",
  },
  {
    index: "03",
    name: "Gọi Video & Thoại",
    desc: "Cuộc gọi HD với khử tiếng ồn, tích hợp sẵn không cần plugin.",
    href: "#calls",
  },
  {
    index: "04",
    name: "Chia sẻ File & Media",
    desc: "Kéo thả và chia sẻ bất cứ thứ gì ngay lập tức với preview.",
    href: "#files",
  },
];

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

function useInViewEl(threshold = 0.15) {
  const ref = useRef<HTMLLIElement>(null);
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

const FeatureRow = ({ feat, index }: { feat: typeof FEATURES[number]; index: number }) => {
  const { ref, visible } = useInViewEl(0.1);
  const [hovered, setHovered] = useState(false);

  return (
    <li
      ref={ref}
      className="border-t border-border last:border-b"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(26px)",
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 90}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 90}ms`,
      }}
    >
      <a
        href={feat.href}
        className="flex items-center gap-6 py-7 group focus-visible:bg-muted outline-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Index */}
        <span className="w-10 text-sm font-medium text-muted-foreground shrink-0">{feat.index}</span>

        {/* Name + desc */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-none mb-1.5 text-slate-900 dark:text-white">{feat.name}</h3>
          <p className="text-sm text-slate-600 dark:text-muted-foreground">{feat.desc}</p>
        </div>

        {/* Arrow circle */}
        <div
          className="w-11 h-11 rounded-full border border-border grid place-items-center shrink-0 transition-colors group-hover:border-foreground"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: hovered ? "translateX(5px)" : "translateX(0)",
              opacity: hovered ? 1 : 0.55,
              transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
            }}
          >
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </div>
      </a>
    </li>
  );
};

export const FeaturesSection = () => {
  const { ref, visible } = useInView(0.15);

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-24 px-6 sm:px-10 bg-slate-50 dark:bg-white/5"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Khả năng cốt lõi
        </div>
        <div>
          {["Xây dựng cho", "mọi đội nhóm"].map((line, i) => (
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

        {/* Feature list */}
        <ul className="mt-14">
          {FEATURES.map((feat, i) => (
            <FeatureRow key={feat.index} feat={feat} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
};
