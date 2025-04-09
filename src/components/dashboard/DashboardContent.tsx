import { useState } from "react";
import CurrentPeriodIndicator from "@/components/dashboard/CurrentPeriodIndicator";
import QuickActionsBar from "@/components/dashboard/QuickActionsBar";
import RemindersSection from "@/components/dashboard/RemindersSection";
import ProgressVisualization from "@/components/dashboard/ProgressVisualization";
import CompletedRemindersSection from "@/components/dashboard/CompletedRemindersSection";
import ReminderEditDialog from "@/components/dashboard/ReminderEditDialog";
import { UIReminder } from "@/types/reminderTypes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import ReminderLoadingState from "./ReminderLoadingState";
import { Button } from "@/components/ui/button";
import IOSPushInstallDemo from '@/components/notifications/IOSPushInstallDemo';

// Define extended reminder type with UI-specific properties
export type UIEnhancedReminder = UIReminder;

interface DashboardContentProps {
  urgentReminders: UIEnhancedReminder[];
  upcomingReminders: UIEnhancedReminder[];
  completedReminders: UIEnhancedReminder[];
  onCompleteReminder: (id: string) => void;
  onUndoComplete: (id: string) => void;
  onNewReminder: () => void;
  onNewVoiceNote: () => void;
  onUpdateReminder: (reminder: UIEnhancedReminder) => void;
  onClearAllCompleted?: () => void;
  onClearCompleted?: (id: string) => void;
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
  onClearAllCompleted,
  onClearCompleted,
  isLoading,
  hasError,
  hasMoreReminders,
  totalCount,
  loadedCount,
  onLoadMore,
  isRefreshing = false
}: DashboardContentProps) => {
  const [selectedReminder, setSelectedReminder] = useState<UIEnhancedReminder | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditReminder = (reminder: UIEnhancedReminder) => {
    setSelectedReminder(reminder);
    setEditDialogOpen(true);
  };

  const handleSaveReminder = (updatedReminder: UIEnhancedReminder) => {
    onUpdateReminder(updatedReminder);
    setSelectedReminder(null);
    setEditDialogOpen(false);
  };

  // If there's an error loading reminders, show an alert with a retry option
  if (hasError) {
    return (
      <div className="space-y-4">
        <CurrentPeriodIndicator />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>There was an error loading your reminders. The error may be related to Firestore connectivity.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={onLoadMore}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
        
        {/* Keep the quick actions bar available even in error state */}
        <QuickActionsBar 
          onNewReminder={onNewReminder}
          onNewVoiceNote={onNewVoiceNote}
        />
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
      
      {/* Subtle refresh indicator at the top */}
      {isRefreshing && (
        <div className="flex items-center justify-end pb-1">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1"></div>
          <span className="text-xs text-muted-foreground">Refreshing...</span>
        </div>
      )}
      
      <QuickActionsBar 
        onNewReminder={onNewReminder}
        onNewVoiceNote={onNewVoiceNote}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Primary content - 2/3 width on desktop */}
        <div className="md:col-span-2 space-y-4 md:space-y-6">
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
            onClearAllCompleted={onClearAllCompleted}
            onClearCompleted={onClearCompleted}
          />
          
          <ProgressVisualization />
        </div>
        
        {/* Secondary content - 1/3 width on desktop */}
        <div>
          {/* This column is reserved for future content */}
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

      {/* Add the iOS Push Installation Demo */}
      <div className="mt-6">
        <IOSPushInstallDemo />
      </div>
    </>
  );
};

export default DashboardContent;
