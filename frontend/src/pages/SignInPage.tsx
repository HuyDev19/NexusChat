import { AuthContainer } from "@/components/auth/AuthContainer";
import { useThemeStore } from "@/stores/useThemeStore";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { ArrowLeft, Sun, Moon } from "lucide-react";

const SignInPage = () => {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="relative h-screen max-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between overflow-hidden font-sans">
      {/* Background Decorative Mesh Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Top Header Controls */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between z-10 shrink-0">
        <Link to="/">
          <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-foreground h-8 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full w-8 h-8"
          title={isDark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 z-10 min-h-0 overflow-hidden">
        <div className="w-full max-w-5xl my-auto">
          <AuthContainer />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2 text-center text-[11px] text-muted-foreground z-10 shrink-0">
        NexusChat © 2026 — Đồ án Công nghệ phần mềm
      </footer>
    </div>
  );
};

export default SignInPage;