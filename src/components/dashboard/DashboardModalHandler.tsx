
import { useState, useCallback } from "react";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { Reminder as UIReminder } from "@/types/reminder";
import { useToast } from "@/hooks/use-toast";
import { convertToBackendReminder } from "@/utils/typeUtils";

interface DashboardModalHandlerProps {
  addReminder: (reminder: any) => Promise<any>;
  refreshReminders: () => Promise<void>;
}

const DashboardModalHandler = ({ 
  addReminder, 
  refreshReminders 
}: DashboardModalHandlerProps) => {
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const { toast } = useToast();

  const handleReminderCreated = useCallback((reminder: UIReminder) => {
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    
    // Add the new reminder to the list
    addReminder(backendReminder)
      .then((savedReminder) => {
        console.log("Reminder saved successfully:", savedReminder);
        toast({
          title: "Reminder Created",
          description: `"${reminder.title}" has been added to your reminders.`
        });
        
        // Use refreshReminders instead of background refresh for immediate update
        refreshReminders().then(() => {
          // We're not using the return value, so we can just resolve a Promise
          return true;
        }).catch((error) => {
          console.error("Error refreshing after adding reminder:", error);
          return false;
        });
      })
      .catch(error => {
        console.error("Error saving reminder:", error);
        toast({
          title: "Error Saving Reminder",
          description: "There was a problem saving your reminder.",
          variant: "destructive"
        });
      });
  }, [addReminder, refreshReminders, toast]);

  const openQuickReminderModal = useCallback(() => {
    setShowQuickReminderModal(true);
  }, []);

  const openVoiceRecorderModal = useCallback(() => {
    setShowVoiceRecorderModal(true);
  }, []);

  return {
    modalComponents: (
      <DashboardModals 
        showQuickReminderModal={showQuickReminderModal}
        setShowQuickReminderModal={setShowQuickReminderModal}
        showVoiceRecorderModal={showVoiceRecorderModal}
        setShowVoiceRecorderModal={setShowVoiceRecorderModal}
        onReminderCreated={handleReminderCreated}
      />
    ),
    openQuickReminderModal,
    openVoiceRecorderModal
  };
};

export default DashboardModalHandler;
