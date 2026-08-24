import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { useChatStore } from "@/stores/useChatStore";
import { 
  CalendarClock, 
  Clock, 
  Send, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ListFilter,
  Calendar,
  Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "+15 phút", minutes: 15 },
  { label: "+1 giờ", minutes: 60 },
  { label: "+3 giờ", minutes: 180 },
  { label: "Sáng mai (09:00)", type: "tomorrow_morning" },
  { label: "Tối nay (20:00)", type: "tonight_evening" },
];

export const ScheduleMessageModal = () => {
  const { isOpen, activeConvoId, scheduledList, loading, closeScheduleModal, createSchedule, cancelSchedule, fetchScheduledMessages } = useScheduleStore();
  const { conversations } = useChatStore();

  const currentConvo = conversations.find((c) => c._id === activeConvoId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "list">("new");

  // Helper to format Date to local ISO string for input[type="datetime-local"]
  const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  // Set default datetime to +30 minutes when opening modal
  useEffect(() => {
    if (isOpen) {
      const defaultDate = new Date(Date.now() + 30 * 60000);
      setScheduledDateTime(toLocalISO(defaultDate));
      setTitle("");
      setContent("");
      if (activeConvoId) {
        fetchScheduledMessages(activeConvoId);
      }
    }
  }, [isOpen, activeConvoId]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    const now = new Date();
    if (preset.minutes) {
      const target = new Date(now.getTime() + preset.minutes * 60000);
      setScheduledDateTime(toLocalISO(target));
    } else if (preset.type === "tomorrow_morning") {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
      setScheduledDateTime(toLocalISO(tomorrow));
    } else if (preset.type === "tonight_evening") {
      const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
      if (tonight.getTime() <= now.getTime()) {
        tonight.setDate(tonight.getDate() + 1);
      }
      setScheduledDateTime(toLocalISO(tonight));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvoId) {
      toast.error("Vui lòng chọn một cuộc trò chuyện để lên lịch");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung tin nhắn");
      return;
    }

    if (!scheduledDateTime) {
      toast.error("Vui lòng chọn thời gian hẹn gửi");
      return;
    }

    const scheduledDate = new Date(scheduledDateTime);
    if (scheduledDate.getTime() <= Date.now() + 10000) {
      toast.error("Thời gian hẹn gửi phải lớn hơn thời gian hiện tại ít nhất 10 giây");
      return;
    }

    const success = await createSchedule({
      conversationId: activeConvoId,
      title: title.trim() || undefined,
      content: content.trim(),
      scheduledFor: scheduledDate.toISOString(),
      type: currentConvo?.type === "direct" ? "direct" : "group",
    });

    if (success) {
      setActiveTab("list");
      setContent("");
      setTitle("");
    }
  };

  const formatScheduleTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getRemainingTime = (dateStr: string) => {
    const diffMs = new Date(dateStr).getTime() - Date.now();
    if (diffMs <= 0) return "Sắp gửi...";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `Còn ${diffDays} ngày`;
    if (diffHours > 0) return `Còn ${diffHours} giờ ${diffMins % 60}p`;
    return `Còn ${diffMins} phút`;
  };

  const convoScheduledList = activeConvoId
    ? scheduledList.filter((item) => (item.conversationId?._id || item.conversationId) === activeConvoId)
    : scheduledList;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeScheduleModal()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-xl p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20">
          <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <CalendarClock className="size-4.5" />
            </div>
            <span>Lên lịch tin nhắn & Lịch hẹn</span>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new" className="gap-2">
                <Clock className="size-4" />
                <span>Lên lịch mới</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2 relative">
                <ListFilter className="size-4" />
                <span>Đang chờ ({convoScheduledList.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: FORM LÊN LỊCH */}
          <TabsContent value="new" className="flex-1 overflow-y-auto beautiful-scrollbar p-4 sm:p-5 space-y-4 m-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tiêu đề / Mục đích (Tùy chọn) */}
              <div className="space-y-1.5">
                <Label htmlFor="schedule-title" className="text-xs font-semibold text-muted-foreground">
                  Tiêu đề / Lời nhắc (Tùy chọn)
                </Label>
                <Input
                  id="schedule-title"
                  placeholder="Ví dụ: Nhắc nộp bài tập đồ án, Chúc mừng sinh nhật..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl"
                  maxLength={100}
                />
              </div>

              {/* Nội dung tin nhắn */}
              <div className="space-y-1.5">
                <Label htmlFor="schedule-content" className="text-xs font-semibold text-muted-foreground">
                  Nội dung tin nhắn <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="schedule-content"
                  placeholder="Nhập nội dung tin nhắn sẽ tự động gửi đúng giờ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] rounded-xl resize-none"
                  required
                />
              </div>

              {/* Chọn thời gian gửi */}
              <div className="space-y-2">
                <Label htmlFor="schedule-datetime" className="text-xs font-semibold text-muted-foreground">
                  Thời gian gửi tự động <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="schedule-datetime"
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="rounded-xl font-medium"
                  required
                />

                {/* Preset nhanh */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-purple-500/10 hover:text-purple-500 border border-border/50 transition-colors font-medium cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeScheduleModal} className="rounded-xl">
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !content.trim() || !scheduledDateTime}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 shadow-md shadow-purple-600/20"
                >
                  <Send className="size-4" />
                  <span>Xác nhận lên lịch</span>
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: DANH SÁCH ĐÃ HẸN */}
          <TabsContent value="list" className="flex-1 overflow-y-auto beautiful-scrollbar p-4 sm:p-5 m-0">
            {convoScheduledList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground/60">
                  <CalendarClock className="size-6" />
                </div>
                <p className="text-sm font-semibold">Chưa có tin nhắn nào được lên lịch</p>
                <p className="text-xs mt-1 max-w-xs">
                  Bạn có thể lên lịch tin nhắn hoặc cuộc hẹn để hệ thống tự động gửi vào đúng thời điểm.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {convoScheduledList.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors flex flex-col gap-2 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[11px] font-bold shrink-0">
                          {getRemainingTime(item.scheduledFor)}
                        </span>
                        {item.title && (
                          <span className="font-semibold text-xs text-foreground truncate">
                            {item.title}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => cancelSchedule(item._id)}
                        className="size-7 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors shrink-0"
                        title="Hủy lịch gửi"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                      <Calendar className="size-3.5" />
                      <span>Thời gian gửi: {formatScheduleTime(item.scheduledFor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMessageModal;
