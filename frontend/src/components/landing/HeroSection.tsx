import { Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { Sparkles, Zap, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { MarqueeTicker } from "./MarqueeTicker";

export const HeroSection = () => {
  const { accessToken } = useAuthStore();

  return (
    <section className="relative overflow-hidden flex flex-col justify-between min-h-[calc(100vh-4rem)] py-4 sm:py-6">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-purple-500/15 via-indigo-500/15 to-pink-500/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Floating mascot cards for desktop */}
      <div className="hidden xl:flex absolute top-16 left-12 animate-float-slow items-center gap-3 p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-purple-500/20 shadow-xl shadow-purple-500/10 pointer-events-none z-20">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
          <PenguinIcon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold">Nexus Penguin 🐧</div>
          <div className="text-[10px] text-muted-foreground">Trò chuyện thời gian thực</div>
        </div>
      </div>

      <div className="hidden xl:flex absolute top-16 right-12 animate-float-reverse items-center gap-3 p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-indigo-500/20 shadow-xl shadow-indigo-500/10 pointer-events-none z-20">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Zap className="w-4.5 h-4.5" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold">Socket.io ⚡</div>
          <div className="text-[10px] text-muted-foreground">Đồng bộ tin nhắn tức thì</div>
        </div>
      </div>

      {/* Main hero content container */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative z-10 my-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold tracking-wide uppercase mb-4 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Đồ Án Công Nghệ Phần Mềm 2026</span>
        </div>

        {/* Title and 3D background screenshots wrapper */}
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center">

          {/* 3D Sunken Background Images (Behind the Title Text) */}
          <div
            className="absolute inset-0 pointer-events-none select-none -z-10 flex items-center justify-center gap-4 sm:gap-8 px-2 sm:px-6"
            style={{ perspective: '1000px' }}
          >
            {/* Left Image — Light Mode UI (Tilted right inward) */}
            <div
              className="w-1/2 max-w-md"
              style={{
                transform: 'rotateY(18deg) rotateX(8deg) scale(0.92) translateX(15px)',
                transformOrigin: 'right center',
              }}
            >
              <div className="rounded-2xl border border-purple-500/25 shadow-2xl overflow-hidden opacity-30 dark:opacity-25 backdrop-blur-sm">
                <div className="h-6 bg-muted/90 border-b border-border/50 px-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-[8px] font-semibold text-muted-foreground uppercase tracking-wide">Light Mode</span>
                </div>
                <div className="aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img src="/placeholder1.png" alt="NexusChat Light UI" className="w-full h-full object-cover object-top" />
                </div>
              </div>
            </div>

            {/* Right Image — Dark Mode UI (Tilted left inward) */}
            <div
              className="w-1/2 max-w-md"
              style={{
                transform: 'rotateY(-18deg) rotateX(8deg) scale(0.92) translateX(-15px)',
                transformOrigin: 'left center',
              }}
            >
              <div className="rounded-2xl border border-indigo-500/25 shadow-2xl overflow-hidden opacity-30 dark:opacity-25 backdrop-blur-sm">
                <div className="h-6 bg-slate-900 border-b border-slate-800 px-3 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-[8px] font-semibold text-purple-300 uppercase tracking-wide">Dark Mode</span>
                </div>
                <div className="aspect-[16/10] overflow-hidden bg-slate-950">
                  <img src="/placeholderSignUp.png" alt="NexusChat Dark UI" className="w-full h-full object-cover object-top" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Title (Foreground over 3D Images) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] py-6 sm:py-10 drop-shadow-sm">
            NexusChat <br />
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
              Thông Minh & Bảo Mật
            </span>
          </h1>
        </div>

        {/* Action CTA Buttons */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 z-20">
          {accessToken ? (
            <Link to="/chat">
              <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-purple-500/25 gap-3 font-semibold group">
                <span>Mở Ứng Dụng Chat</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signin">
                <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-purple-500/25 gap-3 font-semibold group">
                  <LogIn className="w-5 h-5" />
                  <span>Đăng Nhập Ngay</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 font-medium gap-2">
                  <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Tạo Tài Khoản Mới</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Marquee Ticker Banner at the bottom of the section */}
      <MarqueeTicker />
    </section>
  );
};
