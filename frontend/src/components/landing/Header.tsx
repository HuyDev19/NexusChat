import { useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { Button } from "@/components/ui/button";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import {
  Sun,
  Moon,
  LogIn,
  UserPlus,
  MessageCircleCode,
  Menu,
  X,
} from "lucide-react";

export const Header = () => {
  const { accessToken, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform p-1.5">
            <PenguinIcon className="w-6 h-6 text-white drop-shadow-sm" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
              NexusChat
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold -mt-1">
              Đồ án CNPM
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">
            Tính năng
          </a>
          <a href="#about" className="hover:text-primary transition-colors">
            Về dự án
          </a>
        </nav>

        {/* Actions / Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9"
            title={isDark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </Button>

          {accessToken ? (
            <Link to="/chat">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-full px-5 shadow-md shadow-purple-500/20 gap-2">
                <MessageCircleCode className="w-4 h-4" />
                Vào Chat ({user?.username || "Tài khoản"})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signin">
                <Button variant="outline" className="rounded-full border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 gap-2">
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-full px-5 shadow-md shadow-purple-500/20 gap-2">
                  <UserPlus className="w-4 h-4" />
                  Đăng ký
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-9 h-9"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border p-4 bg-background/95 backdrop-blur-lg flex flex-col gap-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium py-2 hover:text-primary"
          >
            Tính năng
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium py-2 hover:text-primary"
          >
            Về dự án
          </a>
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {accessToken ? (
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl gap-2">
                  <MessageCircleCode className="w-4 h-4" /> Vào Chat
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl gap-2">
                    <LogIn className="w-4 h-4" /> Đăng nhập
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl gap-2">
                    <UserPlus className="w-4 h-4" /> Đăng ký ngay
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
