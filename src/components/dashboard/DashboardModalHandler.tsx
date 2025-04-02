
import { useState, useCallback } from "react";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { Reminder as UIReminder } from "@/types/reminder";
import { useToast } from "@/hooks/use-toast";
import { convertToBackendReminder } from "@/utils/typeUtils";

interface DashboardModalHandlerProps {
  addReminder: (reminder: any) => Promise<any>;
  refreshReminders: () => Promise<boolean>;
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
        
        // Use refreshReminders which now returns Promise<boolean>
        refreshReminders().then((success) => {
          if (!success) {
            console.warn("Refresh after adding was not successful");
          }
        }).catch((error) => {
          console.error("Error refreshing after adding reminder:", error);
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
