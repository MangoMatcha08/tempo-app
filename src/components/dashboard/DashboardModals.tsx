
import QuickReminderModal from "@/components/dashboard/QuickReminderModal";
import VoiceRecorderModal from "@/components/dashboard/VoiceRecorderModal";

interface DashboardModalsProps {
  showQuickReminderModal: boolean;
  setShowQuickReminderModal: (show: boolean) => void;
  showVoiceRecorderModal: boolean;
  setShowVoiceRecorderModal: (show: boolean) => void;
}

const DashboardModals = ({
  showQuickReminderModal,
  setShowQuickReminderModal,
  showVoiceRecorderModal,
  setShowVoiceRecorderModal
}: DashboardModalsProps) => {
  return (
    <>
      <QuickReminderModal
        open={showQuickReminderModal}
        onOpenChange={setShowQuickReminderModal}
      />
      
      <VoiceRecorderModal
        open={showVoiceRecorderModal}
        onOpenChange={setShowVoiceRecorderModal}
      />
    </>
  );
};

export default DashboardModals;
