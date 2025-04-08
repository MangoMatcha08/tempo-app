
import { useState, useCallback } from "react";
import QuickReminderModal from "./QuickReminderModal";
import VoiceRecorderModal from "./VoiceRecorderModal";
import EnhancedReminderCreator from "./EnhancedReminderCreator";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DashboardModalHandlerProps {
  addReminder: (reminder: any) => Promise<any>;
  refreshReminders: () => Promise<boolean>;
  useMockData?: boolean;
}

/**
 * Custom hook to manage modals in the dashboard
 */
const DashboardModalHandler = ({
  addReminder,
  refreshReminders,
  useMockData = false
}: DashboardModalHandlerProps) => {
  const [quickReminderOpen, setQuickReminderOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [enhancedReminderOpen, setEnhancedReminderOpen] = useState(false);

  // Open the enhanced reminder modal
  const openQuickReminderModal = useCallback(() => {
    console.log("Opening enhanced reminder modal");
    setEnhancedReminderOpen(true);
  }, []);

  // Open the voice recorder modal
  const openVoiceRecorderModal = useCallback(() => {
    console.log("Opening voice recorder modal");
    setVoiceRecorderOpen(true);
  }, []);

  // Handle a new reminder created from either modal
  const handleReminderCreated = useCallback(async (reminder: any) => {
    console.log("Reminder created from modal:", reminder);
    try {
      // Add the reminder using the provided function
      await addReminder(reminder);
      
      // Refresh reminders to show the new one
      const refreshSuccess = await refreshReminders();
      console.log("Refreshed reminders after creation:", refreshSuccess);
      
      return true;
    } catch (error) {
      console.error("Error handling new reminder from modal:", error);
      return false;
    }
  }, [addReminder, refreshReminders]);

  // Modal components to be rendered
  const modalComponents = (
    <>
      {/* Enhanced Reminder Creator in a Dialog */}
      <Dialog open={enhancedReminderOpen} onOpenChange={setEnhancedReminderOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <EnhancedReminderCreator
            onReminderCreated={(reminder) => {
              handleReminderCreated(reminder);
              setEnhancedReminderOpen(false);
            }}
            onCancel={() => setEnhancedReminderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        open={voiceRecorderOpen}
        onOpenChange={setVoiceRecorderOpen}
        onReminderCreated={handleReminderCreated}
      />
    </>
  );

  return {
    modalComponents,
    openQuickReminderModal,
    openVoiceRecorderModal
  };
};

export default DashboardModalHandler;
