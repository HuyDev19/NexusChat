import { Sun, Moon, Activity } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState, useEffect } from "react";

const PreferencesForm = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { updateProfile } = useUserStore();
  const { user } = useAuthStore();

  const [presenceStatus, setPresenceStatus] = useState<'online' | 'offline' | 'busy'>('online');

  useEffect(() => {
    if (user?.presenceStatus) {
      setPresenceStatus(user.presenceStatus);
    }
  }, [user]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as 'online' | 'offline' | 'busy';
    setPresenceStatus(newStatus);
    await updateProfile({ presenceStatus: newStatus });
  };

  return (
    <Card className="glass-strong border-border/30 rounded-2xl sm:rounded-3xl shadow-xl min-h-[440px] flex flex-col justify-between">
      <div>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sun className="h-4.5 w-4.5" />
            </div>
            <div>
              <span>Tuỳ chỉnh ứng dụng</span>
              <CardDescription className="text-xs mt-0.5">
                Cá nhân hoá giao diện và trải nghiệm trò chuyện của bạn
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div>
                <Label htmlFor="theme-toggle" className="text-xs sm:text-sm font-semibold cursor-pointer">
                  Chế độ tối (Dark Mode)
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Chuyển đổi giao diện sáng hoặc tối cho ứng dụng
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary shrink-0"
            />
          </div>

          {/* Online Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/40 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="online-status" className="text-xs sm:text-sm font-semibold">
                  Trạng thái hoạt động
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Chọn cách hiển thị trạng thái của bạn với bạn bè
                </p>
              </div>
            </div>
            <select
              id="online-status"
              value={presenceStatus}
              onChange={handleStatusChange}
              className="glass-light border border-border/50 bg-background/80 hover:bg-background rounded-xl text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium cursor-pointer shrink-0"
            >
              <option value="online">🟢 Trực tuyến</option>
              <option value="busy">🔴 Đang bận</option>
              <option value="offline">⚫ Ẩn hoạt động</option>
            </select>
          </div>
        </CardContent>
      </div>


    </Card>
  );
};

export default PreferencesForm;
