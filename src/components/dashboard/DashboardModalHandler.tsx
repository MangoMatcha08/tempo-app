
import { useState, useCallback, useEffect } from "react";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { Reminder as UIReminder } from "@/types/reminder";
import { useToast } from "@/hooks/use-toast";
import { convertToBackendReminder } from "@/utils/typeUtils";

interface DashboardModalHandlerProps {
  addReminder: (reminder: any) => Promise<any>;
  refreshReminders: () => Promise<boolean>;
  useMockData?: boolean;
}

const DashboardModalHandler = ({ 
  addReminder, 
  refreshReminders,
  useMockData = false
}: DashboardModalHandlerProps) => {
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const { toast } = useToast();

  const handleReminderCreated = useCallback((reminder: UIReminder) => {
    console.log("Reminder created from modal:", reminder);
    
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    console.log("Converted to backend reminder:", backendReminder);
    
    // Add the new reminder to the list
    addReminder(backendReminder)
      .then((savedReminder) => {
        console.log("Reminder saved successfully:", savedReminder);
        toast({
          title: "Reminder Created",
          description: `"${reminder.title}" has been added to your reminders.`
        });
        
        // Force refresh after adding a reminder
        setTimeout(() => {
          console.log("Triggering delayed refresh after adding reminder");
          refreshReminders()
            .then((success) => {
              console.log("Delayed refresh after adding result:", success);
            })
            .catch(err => {
              console.error("Error in delayed refresh:", err);
            });
        }, 500);
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
    console.log("Opening quick reminder modal");
    setShowQuickReminderModal(true);
  }, []);

  const openVoiceRecorderModal = useCallback(() => {
    console.log("Opening voice recorder modal");
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
