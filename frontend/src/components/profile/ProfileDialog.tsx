import { type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ProfileCard from "./ProfileCard";
import { useAuthStore } from "@/stores/useAuthStore";
import PersonalInfoForm from "./PersonalInfoForm";

interface ProfileDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ProfileDialog = ({ open, setOpen }: ProfileDialogProps) => {
  const { user } = useAuthStore();

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent
        aria-describedby={undefined}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target?.closest?.('.fixed') || target?.closest?.('[role="dialog"]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target?.closest?.('.fixed') || target?.closest?.('[role="dialog"]')) {
            e.preventDefault();
          }
        }}
        className="max-w-4xl w-full p-0 bg-transparent border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden"
      >
        <div className="bg-gradient-glass rounded-2xl sm:rounded-3xl border border-border/40 overflow-hidden">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 max-h-[85vh] overflow-y-auto beautiful-scrollbar">
            {/* heading */}
            <DialogHeader className="mb-5">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Hồ sơ cá nhân
              </DialogTitle>
            </DialogHeader>

            <ProfileCard user={user} />

            <div className="mt-5">
              <PersonalInfoForm userInfo={user} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;