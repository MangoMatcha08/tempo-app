
import { useState, useCallback } from "react";
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

  const handleReminderCreated = useCallback(async (reminder: UIReminder) => {
    console.log("Reminder created from modal:", reminder);
    
    try {
      // Convert UI reminder to backend reminder type
      const backendReminder = convertToBackendReminder(reminder);
      console.log("Converted to backend reminder:", backendReminder);
      
      // Add the new reminder to the list
      const savedReminder = await addReminder(backendReminder);
      console.log("Reminder saved successfully:", savedReminder);
      
      toast({
        title: "Reminder Created",
        description: `"${reminder.title}" has been added to your reminders.`
      });
      
      // Force refresh after adding a reminder
      console.log("Triggering refresh after adding reminder");
      try {
        const refreshSuccess = await refreshReminders();
        console.log("Refresh after adding result:", refreshSuccess);
      } catch (err) {
        console.error("Error in refresh after adding:", err);
      }
      
      return savedReminder;
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast({
        title: "Error Saving Reminder",
        description: "There was a problem saving your reminder.",
        variant: "destructive"
      });
      throw error;
    }
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
