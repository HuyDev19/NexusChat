import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { Zap, Users, ShieldCheck, Sparkles, Lock, Smile } from "lucide-react";

export const MarqueeTicker = () => {
  return (
    <div className="w-full py-3 bg-muted/40 border-t border-border/40 overflow-hidden backdrop-blur-md shrink-0 mt-4">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
        <div className="flex items-center gap-8 shrink-0">
          <span className="flex items-center gap-2"><PenguinIcon className="w-4 h-4 text-purple-500" /> Penguin Mascot</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Nhắn tin tức thì</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Quản lý Bạn Bè & Nhóm</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Bảo mật JWT</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-500" /> Light / Dark Mode</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-500" /> Protected Routes</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Smile className="w-4 h-4 text-yellow-500" /> Emoji & Media</span>
          <span className="text-border">•</span>
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <span className="flex items-center gap-2"><PenguinIcon className="w-4 h-4 text-purple-500" /> Penguin Mascot</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Nhắn tin tức thì</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Quản lý Bạn Bè & Nhóm</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Bảo mật JWT</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-500" /> Light / Dark Mode</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-500" /> Protected Routes</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-2"><Smile className="w-4 h-4 text-yellow-500" /> Emoji & Media</span>
          <span className="text-border">•</span>
        </div>
      </div>
    </div>
  );
};
