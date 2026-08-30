import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { Sun, Moon, MessageCircleCode } from "lucide-react";

interface HeaderProps {
  onOpenContact: () => void;
  onOpenMenu: () => void;
}

export const Header = ({ onOpenContact, onOpenMenu }: HeaderProps) => {
  const { accessToken, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/85 dark:bg-background/85 backdrop-blur-xl border-b border-black/5 dark:border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Left nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-8 flex-1">
          <a
            href="#features"
            onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/80 dark:hover:text-white transition-colors"
          >
            Tính năng
          </a>
          <a
            href="#trust"
            onClick={(e) => { e.preventDefault(); document.getElementById("trust")?.scrollIntoView({ behavior: "smooth" }); }}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-white/80 dark:hover:text-white transition-colors"
          >
            Bảo mật
          </a>
        </nav>

        {/* Center brand */}
        <div className="flex items-center gap-2.5 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-white/15 flex items-center justify-center backdrop-blur-sm border border-primary/20 dark:border-white/20">
            <PenguinIcon className="w-4.5 h-4.5 text-primary dark:text-white" />
          </div>
          <span className="text-base font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white transition-colors">
            NexusChat
          </span>
        </div>

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
            <Link to="/chat">
              <button className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 dark:bg-white/15 hover:bg-primary/20 dark:hover:bg-white/25 border border-primary/20 dark:border-white/20 text-primary dark:text-white text-sm font-medium px-4 py-2 transition-colors backdrop-blur-sm">
                <MessageCircleCode className="w-4 h-4" />
                Vào Chat ({user?.username || "Tài khoản"})
              </button>
            </Link>
          ) : (
            <button
              onClick={onOpenContact}
              className="hidden sm:flex items-center text-sm font-semibold uppercase tracking-wide text-primary dark:text-white/90 hover:text-purple-800 dark:hover:text-white transition-colors underline underline-offset-4"
            >
              Đăng ký
            </button>
          )}

          {/* Burger button */}
          <button
            onClick={onOpenMenu}
            aria-label="Mở menu"
            className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <span className="block w-4 h-px bg-slate-800 dark:bg-white rounded-full" />
            <span className="block w-4 h-px bg-slate-800 dark:bg-white rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};
