import { useState, type Dispatch, type SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import PreferencesForm from "./PreferencesForm";
import PrivacySettings from "./PrivacySettings";

interface SettingsDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const SettingsDialog = ({ open, setOpen }: SettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState("preferences");

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
        className="max-w-2xl w-full p-0 bg-transparent border-0 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden"
      >
        <div className="bg-gradient-glass rounded-2xl sm:rounded-3xl border border-border/40 overflow-hidden">
          <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto beautiful-scrollbar">
            <DialogHeader className="mb-4 sm:mb-5">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Cài Đặt
              </DialogTitle>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-1"
            >
              <TabsList className="grid w-full grid-cols-2 glass-light mb-4 sm:mb-5">
                <TabsTrigger
                  value="preferences"
                  className="data-[state=active]:glass-strong text-xs sm:text-sm cursor-pointer py-2 rounded-xl"
                >
                  Cấu Hình
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="data-[state=active]:glass-strong text-xs sm:text-sm cursor-pointer py-2 rounded-xl"
                >
                  Bảo Mật
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preferences" className="mt-0 focus-visible:outline-none">
                <PreferencesForm />
              </TabsContent>

              <TabsContent value="privacy" className="mt-0 focus-visible:outline-none">
                <PrivacySettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
