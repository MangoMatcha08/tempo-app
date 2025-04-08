
import { useState, useCallback } from "react";
import { 
  AddReminderDialog, 
  VoiceNoteDialog, 
  EnhancedReminderDialog 
} from "./DialogAliases";

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
  const [enhancedReminderOpen, setEnhancedReminderOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);

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
      {/* Enhanced Reminder Dialog */}
      <EnhancedReminderDialog
        open={enhancedReminderOpen}
        onOpenChange={setEnhancedReminderOpen}
        onReminderCreated={handleReminderCreated}
      />

      {/* Voice Note Dialog */}
      <VoiceNoteDialog
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
