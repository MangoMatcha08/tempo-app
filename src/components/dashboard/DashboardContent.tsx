
import { useState, useEffect } from "react";
import CurrentPeriodIndicator from "@/components/dashboard/CurrentPeriodIndicator";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import RemindersSection from "@/components/dashboard/RemindersSection";
import ProgressVisualization from "@/components/dashboard/ProgressVisualization";
import CompletedRemindersSection from "@/components/dashboard/CompletedRemindersSection";
import ReminderEditDialog from "@/components/dashboard/ReminderEditDialog";
import { Reminder } from "@/types/reminder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ReminderLoadingState from "./ReminderLoadingState";

interface DashboardContentProps {
  urgentReminders: Reminder[];
  upcomingReminders: Reminder[];
  completedReminders: Reminder[];
  onCompleteReminder: (id: string) => void;
  onUndoComplete: (id: string) => void;
  onNewReminder: () => void;
  onNewVoiceNote: () => void;
  onUpdateReminder: (reminder: Reminder) => void;
  isLoading: boolean;
  hasError: boolean;
  hasMoreReminders: boolean;
  totalCount: number;
  loadedCount: number;
  onLoadMore: () => void;
  isRefreshing?: boolean;
}

const DashboardContent = ({
  urgentReminders,
  upcomingReminders,
  completedReminders,
  onCompleteReminder,
  onUndoComplete,
  onNewReminder,
  onNewVoiceNote,
  onUpdateReminder,
  isLoading,
  hasError,
  hasMoreReminders,
  totalCount,
  loadedCount,
  onLoadMore,
  isRefreshing = false
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

  // If there's an error loading reminders, show an alert
  if (hasError) {
    return (
      <div className="space-y-4">
        <CurrentPeriodIndicator />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading your reminders. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show a full-page loading state only on initial load, not on background refreshes
  if (isLoading && loadedCount === 0 && !isRefreshing) {
    return (
      <div className="space-y-4">
        <CurrentPeriodIndicator />
        <QuickActionsBar 
          onNewReminder={onNewReminder}
          onNewVoiceNote={onNewVoiceNote}
        />
        <ReminderLoadingState 
          isLoading={true}
          hasMoreReminders={false}
          totalCount={0}
          loadedCount={0}
          onLoadMore={() => {}}
        />
      </div>
    );
  }

  return (
    <>
      <CurrentPeriodIndicator />
      <QuickActionsBar 
        onNewReminder={onNewReminder}
        onNewVoiceNote={onNewVoiceNote}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Primary content - 2/3 width on desktop */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          {isRefreshing && (
            <div className="flex items-center justify-center p-3 bg-slate-50 rounded-lg mb-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-sm text-slate-600">Refreshing your reminders...</span>
            </div>
          )}
          
          <RemindersSection 
            urgentReminders={urgentReminders} 
            upcomingReminders={upcomingReminders} 
            onCompleteReminder={onCompleteReminder}
            onEditReminder={handleEditReminder}
          />
          
          {/* Completed reminders section above the progress visualization */}
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

      {hasMoreReminders && (
        <ReminderLoadingState 
          isLoading={isLoading && !isRefreshing}
          hasMoreReminders={hasMoreReminders}
          totalCount={totalCount}
          loadedCount={loadedCount}
          onLoadMore={onLoadMore}
        />
      )}

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
