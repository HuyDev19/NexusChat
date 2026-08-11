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
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          Tuỳ chỉnh ứng dụng
        </CardTitle>
        <CardDescription>
          Cá nhân hoá trải nghiệm trò chuyện của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="theme-toggle" className="text-base font-medium">
              Chế độ tối
            </Label>
            <p className="text-sm text-muted-foreground">
              Chuyển đổi giữa giao diện sáng và tối
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary-glow"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="online-status" className="text-base font-medium">
              Trạng thái hoạt động
            </Label>
            <p className="text-sm text-muted-foreground">
              Chọn trạng thái hiển thị của bạn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <select
              id="online-status"
              value={presenceStatus}
              onChange={handleStatusChange}
              className="glass-light border-border/30 bg-background rounded-md text-sm p-1.5 focus:outline-none"
            >
              <option value="online">Trực tuyến</option>
              <option value="busy">Đang bận</option>
              <option value="offline">Ngoại tuyến</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesForm;
