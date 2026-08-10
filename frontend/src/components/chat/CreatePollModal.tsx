import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Plus, X, BarChart2 } from "lucide-react";

export default function CreatePollModal({
  open,
  onOpenChange,
  onCreatePoll,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (poll: { question: string; options: { text: string }[]; allowMultiple: boolean }) => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ text: "" }, { text: "" }]);

  const handleAddOption = () => {
    setOptions([...options, { text: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.text.trim() !== "");
    if (question.trim() && validOptions.length >= 2) {
      onCreatePoll({
        question: question.trim(),
        options: validOptions.map(o => ({ text: o.text.trim() })),
        allowMultiple: false, // According to user's requirement
      });
      setQuestion("");
      setOptions([{ text: "" }, { text: "" }]);
      onOpenChange(false);
    }
  };

  const isValid = question.trim() !== "" && options.filter(o => o.text.trim() !== "").length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="size-5" />
            Tạo bình chọn
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Câu hỏi</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Đặt câu hỏi bình chọn (Ví dụ: Tối nay ăn gì?)"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Các lựa chọn</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Lựa chọn ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={handleAddOption}
          >
            <Plus className="size-4 mr-2" />
            Thêm lựa chọn
          </Button>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid}
          >
            Tạo bình chọn
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
