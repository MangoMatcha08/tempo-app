
import QuickReminderModal from "@/components/dashboard/QuickReminderModal";
import VoiceRecorderModal from "@/components/dashboard/VoiceRecorderModal";
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { convertToUIReminder } from "@/utils/typeUtils";

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
  // Handler to convert BackendReminder to UIReminder before passing to callback
  const handleReminderCreated = (reminder: BackendReminder) => {
    if (onReminderCreated) {
      const uiReminder = convertToUIReminder(reminder);
      onReminderCreated(uiReminder);
    }
  };

  return (
    <>
      <QuickReminderModal
        open={showQuickReminderModal}
        onOpenChange={setShowQuickReminderModal}
        onReminderCreated={handleReminderCreated}
      />
      
      <VoiceRecorderModal
        open={showVoiceRecorderModal}
        onOpenChange={setShowVoiceRecorderModal}
        onReminderCreated={handleReminderCreated}
      />
    </>
  );
};

export default DashboardModals;
