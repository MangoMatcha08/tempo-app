
import QuickReminderModal from "@/components/dashboard/QuickReminderModal";
import VoiceRecorderModal from "@/components/dashboard/VoiceRecorderModal";
import { Reminder } from "@/types/reminderTypes";

interface DashboardModalsProps {
  showQuickReminderModal: boolean;
  setShowQuickReminderModal: (show: boolean) => void;
  showVoiceRecorderModal: boolean;
  setShowVoiceRecorderModal: (show: boolean) => void;
  onReminderCreated?: (reminder: Reminder) => void;
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
      <QuickReminderModal
        open={showQuickReminderModal}
        onOpenChange={setShowQuickReminderModal}
        onReminderCreated={onReminderCreated}
      />
      
      <VoiceRecorderModal
        open={showVoiceRecorderModal}
        onOpenChange={setShowVoiceRecorderModal}
        onReminderCreated={onReminderCreated}
      />
    </>
  );
};

export default DashboardModals;
