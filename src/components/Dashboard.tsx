
import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardModals from "@/components/dashboard/DashboardModals";
import { Reminder } from "@/types/reminderTypes";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const { toast } = useToast();
  
  const {
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder
  } = useReminders();

  const handleReminderCreated = (reminder: Reminder) => {
    // Add the new reminder to the list
    addReminder(reminder);
    
    toast({
      title: "Reminder Created",
      description: `"${reminder.title}" has been added to your reminders.`
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <DashboardHeader title="Tempo Dashboard" />
      
      <DashboardContent 
        urgentReminders={urgentReminders}
        upcomingReminders={upcomingReminders}
        completedReminders={completedReminders}
        onCompleteReminder={handleCompleteReminder}
        onUndoComplete={handleUndoComplete}
        onNewReminder={() => setShowQuickReminderModal(true)}
        onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
      />
      
      <DashboardModals 
        showQuickReminderModal={showQuickReminderModal}
        setShowQuickReminderModal={setShowQuickReminderModal}
        showVoiceRecorderModal={showVoiceRecorderModal}
        setShowVoiceRecorderModal={setShowVoiceRecorderModal}
        onReminderCreated={handleReminderCreated}
      />
    </div>
  );
};

export default Dashboard;
