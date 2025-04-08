
import { AddReminderDialog, VoiceNoteDialog } from "@/components/dashboard/DialogAliases";
import { UIReminder } from "@/types/reminderTypes";

interface DashboardModalsProps {
  showQuickReminderModal: boolean;
  setShowQuickReminderModal: (show: boolean) => void;
  showVoiceRecorderModal: boolean;
  setShowVoiceRecorderModal: (show: boolean) => void;
  onReminderCreated?: (reminder: UIReminder) => void;
}

const DashboardModals = ({
  showQuickReminderModal,
  setShowQuickReminderModal,
  showVoiceRecorderModal,
  setShowVoiceRecorderModal,
  onReminderCreated
}: DashboardModalsProps) => {
  return (
    <>
      <AddReminderDialog
        open={showQuickReminderModal}
        onOpenChange={setShowQuickReminderModal}
        onReminderCreated={onReminderCreated}
      />
      
      <VoiceNoteDialog
        open={showVoiceRecorderModal}
        onOpenChange={setShowVoiceRecorderModal}
        onReminderCreated={onReminderCreated}
      />
    </>
  );
};

export default DashboardModals;
