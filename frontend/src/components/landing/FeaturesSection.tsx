import { Zap, Users, ShieldCheck, Sparkles, Smile, Lock } from "lucide-react";

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-2">
            Tính năng nổi bật
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nhắn tin thời gian thực</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tích hợp Socket.io giúp truyền tải tin nhắn tức thì với độ trễ cực thấp. Trạng thái unread và đang gõ phím được đồng bộ liên tục.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Quản lý bạn bè & Chat nhóm</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Dễ dàng tìm kiếm người dùng, gửi/nhận lời mời kết bạn, tạo các nhóm trò chuyện linh hoạt cho học tập và công việc.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Bảo mật & Xác thực JWT</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Hệ thống xác thực mã hóa token an toàn (Access Token & Refresh Token Cookie), mật khẩu được băm hóa bcrypt bảo mật tối đa.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Giao diện Đêm / Sáng</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tùy chọn linh hoạt Light Mode và Dark Mode chuẩn Glassmorphism, chuyển đổi mượt mà bảo vệ mắt người dùng.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Smile className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Biểu cảm Emoji & Media</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tích hợp bộ chọn Emoji Mart phong phú, dễ dàng chèn biểu cảm và tải ảnh đại diện cá nhân hóa.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-2xl bg-card border border-border/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Phân quyền Route Bảo vệ</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Các đường dẫn trò chuyện được bảo vệ nghiêm ngặt thông qua ProtectedRoute middleware client-side và backend.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
