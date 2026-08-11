import { Link } from "react-router";
import { PenguinIcon } from "@/components/ui/PenguinIcon";

export const Footer = () => {
  return (
    <footer id="about" className="py-8 border-t border-border/50 bg-background text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 p-1 flex items-center justify-center text-white shadow-sm">
            <PenguinIcon className="w-4.5 h-4.5" />
          </div>
          <span className="font-semibold text-foreground">NexusChat</span>
          <span>— Đồ Án Công Nghệ Phần Mềm</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/signin" className="hover:text-primary transition-colors">
            Đăng nhập
          </Link>
          <Link to="/signup" className="hover:text-primary transition-colors">
            Đăng ký
          </Link>
          <span>© 2026 NexusChat. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
