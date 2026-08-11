import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export const CtaBanner = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40 border-t border-border/40 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
          Sẵn sàng trải nghiệm NexusChat?
        </h2>
        <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8">
          Bấm vào nút bên dưới để tiến hành đăng nhập vào ứng dụng và bắt đầu trò chuyện ngay lập tức.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/signin">
            <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-purple-500/20 gap-2">
              <LogIn className="w-5 h-5" />
              Đăng Nhập Vào Hệ Thống
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="outline" className="h-12 px-6 rounded-full border-purple-500/30">
              Đăng Ký Tài Khoản
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
