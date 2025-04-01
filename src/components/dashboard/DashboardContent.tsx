
import { useState } from "react";
import CurrentPeriodIndicator from "@/components/dashboard/CurrentPeriodIndicator";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import RemindersSection from "@/components/dashboard/RemindersSection";
import ProgressVisualization from "@/components/dashboard/ProgressVisualization";
import CompletedRemindersSection from "@/components/dashboard/CompletedRemindersSection";
import ReminderEditDialog from "@/components/dashboard/ReminderEditDialog";
import { Reminder } from "@/types/reminder";

interface DashboardContentProps {
  urgentReminders: Reminder[];
  upcomingReminders: Reminder[];
  completedReminders: Reminder[];
  onCompleteReminder: (id: string) => void;
  onUndoComplete: (id: string) => void;
  onNewReminder: () => void;
  onNewVoiceNote: () => void;
  onUpdateReminder: (reminder: Reminder) => void;
}

const DashboardContent = ({
  urgentReminders,
  upcomingReminders,
  completedReminders,
  onCompleteReminder,
  onUndoComplete,
  onNewReminder,
  onNewVoiceNote,
  onUpdateReminder
}: DashboardContentProps) => {
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditReminder = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setEditDialogOpen(true);
  };

  const handleSaveReminder = (updatedReminder: Reminder) => {
    onUpdateReminder(updatedReminder);
    setSelectedReminder(null);
    setEditDialogOpen(false);
  };

  return (
    <>
      <CurrentPeriodIndicator />
      <QuickActionsBar 
        onNewReminder={onNewReminder}
        onNewVoiceNote={onNewVoiceNote}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary content - 2/3 width on desktop */}
        <div className="md:col-span-2 space-y-6">
          <RemindersSection 
            urgentReminders={urgentReminders} 
            upcomingReminders={upcomingReminders} 
            onCompleteReminder={onCompleteReminder}
            onEditReminder={handleEditReminder}
          />
          
          {/* Completed reminders section moved above the progress visualization */}
          <CompletedRemindersSection 
            reminders={completedReminders}
            onUndoComplete={onUndoComplete}
          />
          
          <ProgressVisualization />
        </div>
        
        {/* Secondary content - 1/3 width on desktop */}
        <div>
          {/* CompletedRemindersSection has been moved out of here */}
        </div>
      </div>

      <ReminderEditDialog 
        reminder={selectedReminder}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveReminder}
      />
    </>
  );
};

export default DashboardContent;
