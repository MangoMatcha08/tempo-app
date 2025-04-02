
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
        
        // Always trigger a refresh after adding a reminder, regardless of mock data status
        console.log("Triggering refresh after adding reminder");
        return refreshReminders()
          .then((success) => {
            console.log("Refresh after adding result:", success);
            if (!success) {
              console.warn("Refresh after adding was not successful");
            }
            return success;
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
