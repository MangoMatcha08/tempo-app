
import { useState, useCallback, useRef } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleReminderCreated = useCallback(async (reminder: UIReminder) => {
    console.log("Reminder created from modal:", reminder);
    
    if (isSubmitting) {
      console.log("Already submitting a reminder, skipping duplicate submission");
      return null;
    }
    
    // Set submitting state and create a timeout to reset it after 5 seconds as a failsafe
    setIsSubmitting(true);
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }
    
    submissionTimeoutRef.current = setTimeout(() => {
      setIsSubmitting(false);
      submissionTimeoutRef.current = null;
    }, 5000);
    
    try {
      // Convert UI reminder to backend reminder type
      const backendReminder = convertToBackendReminder(reminder);
      console.log("Converted to backend reminder:", backendReminder);
      
      // Add the new reminder to the list
      const savedReminder = await addReminder(backendReminder);
      console.log("Reminder saved successfully:", savedReminder);
      
      // No need for toast here since Dashboard will handle it
      
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
    } finally {
      // Clean up timeout and reset state
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
        submissionTimeoutRef.current = null;
      }
      setIsSubmitting(false);
    }
  }, [addReminder, refreshReminders, toast, isSubmitting]);

  // Clean up on unmount
  useCallback(() => {
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    };
  }, []);

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
