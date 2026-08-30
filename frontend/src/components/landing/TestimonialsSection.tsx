import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    quote: "NexusChat giảm thời gian phản hồi của team xuống còn một nửa. Hiệu năng khác hẳn với bất cứ thứ gì chúng tôi đã dùng.",
    name: "Nguyễn Văn An",
    role: "Lead Engineer, Dropship Co.",
  },
  {
    quote: "Chúng tôi chuyển 200 nhân viên chỉ trong một cuối tuần. Zero downtime, không ai phàn nàn — nói lên tất cả.",
    name: "Trần Thị Bình",
    role: "CTO, Launchpad Studio",
  },
  {
    quote: "Team từ xa của tôi cuối cùng cảm thấy như đang cùng phòng. Chất lượng âm thanh cuộc gọi một mình đã đáng để chuyển sang.",
    name: "Lê Hồng Minh",
    role: "Head of Product, NovaTech",
  },
];

function useInViewEl(threshold = 0.1) {
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

const TestimonialCard = ({ t, index }: { t: typeof TESTIMONIALS[number]; index: number }) => {
  const { ref, visible } = useInViewEl(0.1);
  const [hovered, setHovered] = useState(false);

  return (
    <li
      ref={ref}
      className="flex flex-col justify-between h-full rounded-2xl p-7 cursor-default transition-all duration-300 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? hovered ? "translateY(-8px)" : "translateY(0)"
          : "translateY(40px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform ${visible ? "0.4s" : `0.7s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`}`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <span className="text-4xl text-primary leading-none font-serif">"</span>
        <blockquote className="text-base leading-relaxed text-foreground mt-4">{t.quote}</blockquote>
      </div>
      <figcaption
        className="mt-6 pt-4"
        style={{ borderTop: "1px solid var(--hairline, #e6e8ec)" }}
      >
        <p className="font-medium text-sm">{t.name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{t.role}</p>
      </figcaption>
    </li>
  );
};

export const TestimonialsSection = () => {
  const { ref, visible } = useInView(0.15);

  return (
    <section
      id="testimonials"
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-white dark:bg-background py-20 sm:py-24 px-6 sm:px-10"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          Người dùng nói gì
        </div>
        <div>
          {["Được yêu thích", "bởi mọi team"].map((line, i) => (
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

        {/* Grid */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
};
