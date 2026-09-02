import { useEffect, useRef, useState } from "react";
import api from "../../lib/axios";
import { SubmitReviewModal } from "./SubmitReviewModal";
import { Star } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";
import { toast } from "sonner";

const FALLBACK_TESTIMONIALS = [
  {
    content: "NexusChat giảm thời gian phản hồi của team xuống còn một nửa. Hiệu năng khác hẳn với bất cứ thứ gì chúng tôi đã dùng.",
    user: { displayName: "Nguyễn Văn An", avatarUrl: "" },
    rating: 5,
  },
  {
    content: "Chúng tôi chuyển 200 nhân viên chỉ trong một cuối tuần. Zero downtime, không ai phàn nàn — nói lên tất cả.",
    user: { displayName: "Trần Thị Bình", avatarUrl: "" },
    rating: 5,
  },
  {
    content: "Team từ xa của tôi cuối cùng cảm thấy như đang cùng phòng. Chất lượng âm thanh cuộc gọi một mình đã đáng để chuyển sang.",
    user: { displayName: "Lê Hồng Minh", avatarUrl: "" },
    rating: 5,
  },
];

function useInViewEl(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
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

const TestimonialCard = ({ t, index }: { t: any; index: number }) => {
  const { ref, visible } = useInViewEl(0.1);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className="flex flex-col justify-between h-full min-h-[280px] rounded-2xl p-7 cursor-default transition-all duration-300 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shrink-0 w-[300px] sm:w-[320px] md:w-auto snap-center"
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
        <div className="flex gap-1 mb-4 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < (t.rating || 5) ? "fill-current" : "text-slate-300 dark:text-slate-700 fill-transparent"}`} />
          ))}
        </div>
        <blockquote className="text-base leading-relaxed text-foreground break-words">{t.content}</blockquote>
      </div>
      <div
        className="mt-6 pt-4 flex items-center gap-3"
        style={{ borderTop: "1px solid var(--hairline, #e6e8ec)" }}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 shrink-0">
          <img 
            src={t.user?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + (t.user?.displayName || "User")} 
            alt={t.user?.displayName} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-medium text-sm line-clamp-1">{t.user?.displayName || "Người dùng ẩn danh"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Người dùng NexusChat</p>
        </div>
      </div>
    </div>
  );
};

export const TestimonialsSection = () => {
  const { ref, visible } = useInView(0.15);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews");
      if (res.data.success && res.data.reviews.length > 0) {
        setReviews(res.data.reviews);
      } else {
        setReviews(FALLBACK_TESTIMONIALS);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
      setReviews(FALLBACK_TESTIMONIALS);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleWriteReview = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để gửi đánh giá.");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <section
      id="testimonials"
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-white dark:bg-background py-20 sm:py-24 px-6 sm:px-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              Đánh giá từ cộng đồng
            </div>
            <div>
              {["Được yêu thích", "bởi mọi người"].map((line, i) => (
                <div key={line} className="line-clip">
                  <h2
                    className="text-4xl md:text-5xl font-semibold leading-[1.15] tracking-tight text-slate-900 dark:text-white"
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
          </div>
          
          <button 
            onClick={handleWriteReview}
            className="px-6 py-3 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-sm hover:scale-105 transition-transform"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease 0.4s",
            }}
          >
            Viết đánh giá
          </button>
        </div>

        {/* Horizontal scroll grid for reviews */}
        <div className="flex overflow-x-auto pb-8 -mx-6 px-6 md:mx-0 md:px-0 gap-5 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pb-0 md:snap-none">
          {reviews.map((t, i) => (
            <TestimonialCard key={t._id || i} t={t} index={i} />
          ))}
        </div>
      </div>

      <SubmitReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchReviews}
      />
    </section>
  );
};
