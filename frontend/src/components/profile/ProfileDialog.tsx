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
        className="overflow-y-auto max-h-[95vh] p-0 bg-transparent border-0 shadow-2xl"
      >
        <div className="bg-gradient-glass">
          <div className="max-w-4xl mx-auto p-4">
            {/* heading */}
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-foreground">
                Hồ sơ cá nhân
              </DialogTitle>
            </DialogHeader>

            <ProfileCard user={user} />

            <div className="mt-6">
              <PersonalInfoForm userInfo={user} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;