import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserPlus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SearchForm from "@/components/AddFriendModal/SearchForm";
import SendFriendRequestForm from "@/components/AddFriendModal/SendFriendRequestForm";
import UserAvatar from "./UserAvatar";

export interface IFormValues {
  username: string;
  message: string;
}

interface AddFriendModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AddFriendModal = ({ open, onOpenChange }: AddFriendModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const showModal = isControlled ? open : internalOpen;

  const [step, setStep] = useState<0 | 1 | 2>(0); // 0: Search, 1: Results, 2: Send Request
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const { loading, searchByUsername, addFriend } = useFriendStore();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IFormValues>({
    defaultValues: { username: "", message: "" },
  });

  const usernameValue = watch("username");

  const handleCancel = () => {
    reset();
    setSearchedKeyword("");
    setFoundUsers([]);
    setSelectedUser(null);
    setStep(0);
  };

  const handleOpenChange = (val: boolean) => {
    if (isControlled) {
      onOpenChange?.(val);
    } else {
      setInternalOpen(val);
    }
    if (!val) {
      handleCancel();
    }
  };

  const handleSearch = handleSubmit(async (data) => {
    const keyword = data.username.trim();
    if (!keyword) return;

    setSearchedKeyword(keyword);

    try {
      const users = await searchByUsername(keyword);
      setFoundUsers(users || []);
      setStep(1); // Go to results step
    } catch (error) {
      console.error(error);
      setFoundUsers([]);
      setStep(1);
    }
  });

  const handleSend = handleSubmit(async (data) => {
    if (!selectedUser) return;

    try {
      const message = await addFriend(selectedUser._id, data.message.trim());
      toast.success(message);

      handleCancel();
      handleOpenChange(false);
    } catch (error) {
      console.error("Lỗi xảy ra khi gửi request từ form", error);
      const errorMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Lỗi xảy ra khi gửi kết bạn. Hãy thử lại";

      toast.error(errorMessage);
    }
  });

  return (
    <Dialog open={showModal} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
            <UserPlus className="size-4" />
            <span className="sr-only">Kết bạn</span>
          </div>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[425px] glass border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserPlus className="size-5 text-primary" />
            Kết Bạn
          </DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <SearchForm
            register={register}
            errors={errors}
            usernameValue={usernameValue}
            loading={loading}
            isFound={null}
            searchedUsername={searchedKeyword}
            onSubmit={handleSearch}
            onCancel={handleCancel}
          />
        )}

        {step === 1 && (
          <div className="space-y-4">
            {foundUsers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Tìm thấy {foundUsers.length} kết quả cho "{searchedKeyword}":
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {foundUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        setSelectedUser(user);
                        setStep(2);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={user.displayName || user.username}
                          avatarUrl={user.avatarUrl}
                          type="sidebar"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {user.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            @{user.username}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                        Chọn
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-foreground">Không tìm thấy người dùng nào</p>
                <p className="text-xs text-muted-foreground mt-1">Vui lòng thử lại với tên khác.</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="w-full py-2 px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
                onClick={() => setStep(0)}
              >
                Quay lại tìm kiếm
              </button>
            </div>
          </div>
        )}

        {step === 2 && selectedUser && (
          <SendFriendRequestForm
            register={register}
            loading={loading}
            searchedUsername={selectedUser.username}
            onSubmit={handleSend}
            onBack={() => setStep(1)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
