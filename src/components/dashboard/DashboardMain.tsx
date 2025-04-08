
import { useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardContent from '@/components/dashboard/DashboardContent';
import AddReminderDialog from '@/components/dashboard/AddReminderDialog';
import VoiceNoteDialog from '@/components/dashboard/VoiceNoteDialog'; 
import { UIReminder } from '@/types/reminderTypes';
import { ReminderStats } from '@/types/statsTypes';
import { useNotificationHandler } from '@/hooks/notifications/useNotificationHandler';
import { useReminderPagination } from '@/hooks/reminders/useReminderPagination';
import { useFeature } from '@/contexts/FeatureFlagContext';

interface DashboardMainProps {
  reminders: UIReminder[];
  loading: boolean;
  isRefreshing: boolean;
  urgentReminders: UIReminder[];
  upcomingReminders: UIReminder[];
  completedReminders: UIReminder[];
  reminderStats: ReminderStats;
  handleCompleteReminder: (id: string) => Promise<boolean>;
  handleUndoComplete: (id: string) => Promise<boolean>;
  addReminder: (reminder: any) => Promise<boolean>;
  updateReminder: (reminder: UIReminder) => Promise<boolean>;
  loadMoreReminders: () => void;
  refreshReminders: () => Promise<boolean>;
  hasMore: boolean;
  totalCount: number;
  hasError: boolean;
  addToBatchComplete?: (id: string, complete: boolean) => void;
  addToBatchUpdate?: (reminder: UIReminder) => void;
  deleteReminder?: (id: string) => Promise<boolean>;
  batchDeleteReminders?: (ids: string[]) => Promise<boolean>;
}

const DashboardMain = ({
  reminders,
  loading,
  isRefreshing,
  urgentReminders,
  upcomingReminders,
  completedReminders,
  reminderStats,
  handleCompleteReminder,
  handleUndoComplete,
  addReminder,
  updateReminder,
  loadMoreReminders,
  refreshReminders,
  hasMore,
  totalCount,
  hasError,
  addToBatchComplete,
  addToBatchUpdate,
  deleteReminder,
  batchDeleteReminders
}: DashboardMainProps) => {
  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [voiceNoteOpen, setVoiceNoteOpen] = useState(false);
  const { sendNotification } = useNotificationHandler();
  
  // Check feature flags
  const usePaginationFeature = useFeature('PAGINATED_LOADING');
  
  // Use pagination hook if the feature is enabled
  const paginatedReminders = useReminderPagination({
    filterCompleted: false,
    orderBy: 'dueDate',
    orderDirection: 'asc'
  });
  
  // Decide whether to use pagination or the traditional approach
  const shouldUsePagination = usePaginationFeature;
  
  const handleNewReminder = useCallback(() => {
    setAddReminderOpen(true);
  }, []);

  const handleNewVoiceNote = useCallback(() => {
    setVoiceNoteOpen(true);
  }, []);

  const handleAddReminder = useCallback(async (reminder: any) => {
    const success = await addReminder(reminder);
    
    if (success) {
      // Show notification on success
      sendNotification({
        title: "Reminder Added",
        body: `"${reminder.title}" has been added to your reminders.`,
        type: "success"
      });
    }
    
    return success;
  }, [addReminder, sendNotification]);

  const handleClearAllCompleted = useCallback(async () => {
    if (!batchDeleteReminders || completedReminders.length === 0) return;
    
    const ids = completedReminders.map(reminder => reminder.id);
    const success = await batchDeleteReminders(ids);
    
    if (success) {
      sendNotification({
        title: "Reminders Cleared",
        body: `${ids.length} completed ${ids.length === 1 ? 'reminder' : 'reminders'} cleared.`,
        type: "info"
      });
    }
  }, [batchDeleteReminders, completedReminders, sendNotification]);

  const handleClearCompleted = useCallback(async (id: string) => {
    if (!deleteReminder) return;
    
    const success = await deleteReminder(id);
    
    if (success) {
      sendNotification({
        title: "Reminder Removed",
        body: "The completed reminder has been removed.",
        type: "info"
      });
    }
  }, [deleteReminder, sendNotification]);

  return (
    <DashboardLayout>
      <DashboardContent
        urgentReminders={urgentReminders}
        upcomingReminders={shouldUsePagination ? paginatedReminders.items : upcomingReminders}
        completedReminders={completedReminders}
        onCompleteReminder={handleCompleteReminder}
        onUndoComplete={handleUndoComplete}
        onNewReminder={handleNewReminder}
        onNewVoiceNote={handleNewVoiceNote}
        onUpdateReminder={updateReminder}
        onClearAllCompleted={handleClearAllCompleted}
        onClearCompleted={handleClearCompleted}
        isLoading={shouldUsePagination ? paginatedReminders.isLoading : loading}
        hasError={hasError}
        hasMoreReminders={shouldUsePagination ? paginatedReminders.hasMore : hasMore}
        totalCount={shouldUsePagination ? paginatedReminders.totalItems : totalCount}
        loadedCount={reminders.length}
        onLoadMore={shouldUsePagination ? paginatedReminders.loadMore : loadMoreReminders}
        isRefreshing={isRefreshing}
        currentPage={paginatedReminders.currentPage}
        totalPages={paginatedReminders.totalPages}
        onPageChange={paginatedReminders.goToPage}
      />

      <AddReminderDialog
        open={addReminderOpen}
        onOpenChange={setAddReminderOpen}
        onAddReminder={handleAddReminder}
      />
      
      <VoiceNoteDialog
        open={voiceNoteOpen}
        onOpenChange={setVoiceNoteOpen}
        onAddReminder={handleAddReminder}
      />
    </DashboardLayout>
  );
};

export default DashboardMain;
