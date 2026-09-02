import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { Sun, Moon, MessageCircleCode } from "lucide-react";

interface HeaderProps {
  onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
  const { accessToken, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 px-4 transition-all duration-500 pointer-events-none">
      <header
        className={`w-full max-w-5xl rounded-full transition-all duration-500 pointer-events-auto ${
          scrolled
            ? "bg-white/85 dark:bg-black/60 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-lg"
            : "bg-white/50 dark:bg-black/30 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-sm"
        }`}
      >
        <div className="px-5 sm:px-8 h-14 flex items-center justify-between">
          {/* Left brand */}
          <Link 
            to="/" 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-white/15 flex items-center justify-center backdrop-blur-sm border border-primary/20 dark:border-white/20">
              <PenguinIcon className="w-4.5 h-4.5 text-primary dark:text-white" />
            </div>
            <span className="text-base font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white transition-colors">
              NexusChat
            </span>
          </Link>

          {/* Center nav (desktop) */}
          <nav className="hidden lg:flex items-center justify-center gap-6 flex-1">
            <a
              href="#trust"
              onClick={(e) => { e.preventDefault(); document.getElementById("trust")?.scrollIntoView({ behavior: "smooth" }); }}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-primary dark:text-white/80 dark:hover:text-white transition-colors"
            >
              Tính năng
            </a>
            <a
              href="#features"
              onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-primary dark:text-white/80 dark:hover:text-white transition-colors"
            >
              Bảo mật
            </a>
            <a
              href="#changelog"
              onClick={(e) => { e.preventDefault(); document.getElementById("changelog")?.scrollIntoView({ behavior: "smooth" }); }}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-primary dark:text-white/80 dark:hover:text-white transition-colors"
            >
              Cập nhật
            </a>
            <a
              href="#testimonials"
              onClick={(e) => { e.preventDefault(); document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" }); }}
              className="whitespace-nowrap text-sm font-medium text-slate-600 hover:text-primary dark:text-white/80 dark:hover:text-white transition-colors"
            >
              Đánh giá
            </a>
          </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white"
            title={isDark ? "Chế độ sáng" : "Chế độ tối"}
          >
            {isDark
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {accessToken ? (
            <Link to="/chat" className="hidden sm:flex items-center gap-3 group bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full pl-1.5 pr-4 py-1.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors pointer-events-auto">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-primary/10 shrink-0">
                <img 
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username || "User"}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-white">
                {user?.displayName || user?.username || "Tài khoản"}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/signin"
                className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white transition-colors px-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/signup"
                className="items-center text-[13px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all rounded-full px-5 py-2.5 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Burger button */}
          <button
            onClick={onOpenMenu}
            aria-label="Mở menu"
            className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <span className="block w-4 h-px bg-slate-800 dark:bg-white rounded-full" />
            <span className="block w-4 h-px bg-slate-800 dark:bg-white rounded-full" />
          </button>
        </div>
        </div>
      </header>
    </div>
  );
};
