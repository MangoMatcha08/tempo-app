
import { useCallback } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { convertToBackendReminder } from "@/utils/typeUtils";
import DashboardModalHandler from "@/components/dashboard/DashboardModalHandler";
import { useFirestore } from "@/contexts/FirestoreContext";
import { Reminder } from "@/types/reminderTypes";

interface DashboardMainProps {
  reminders: any[];
  loading: boolean;
  isRefreshing: boolean;
  urgentReminders: any[];
  upcomingReminders: any[];
  completedReminders: any[];
  reminderStats: any;
  handleCompleteReminder: (id: string) => void;
  handleUndoComplete: (id: string) => void;
  addReminder: (reminder: any) => Promise<any>;
  updateReminder: (reminder: any) => Promise<any>;
  loadMoreReminders: () => Promise<void>;
  refreshReminders: () => Promise<boolean>;
  hasMore: boolean;
  totalCount: number;
  hasError: boolean;
  addToBatchComplete: (id: string) => void;
  addToBatchUpdate: (reminder: Reminder) => void;
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
  const { toast } = useToast();
  const { hasFirestorePermissions, useMockData } = useFirestore();

  // Enhanced reminder operations with batching support
  const handleBatchedCompleteReminder = useCallback((id: string) => {
    // For immediate visual feedback, still call the individual operation
    handleCompleteReminder(id);
    
    // Add to batch for efficient processing
    addToBatchComplete(id);
  }, [handleCompleteReminder, addToBatchComplete]);
  
  const handleBatchedReminderUpdated = useCallback((reminder: any) => {
    // For immediate visual feedback, still call the individual operation
    updateReminder(convertToBackendReminder(reminder));
    
    // Add to batch for efficient processing
    addToBatchUpdate(reminder);
    
    toast({
      title: "Reminder Updated",
      description: `"${reminder.title}" has been updated.`
    });
  }, [updateReminder, addToBatchUpdate, toast]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      console.log("Loading more reminders");
      loadMoreReminders().catch(error => {
        console.error("Error loading more reminders:", error);
        toast({
          title: "Error Loading Reminders",
          description: "There was a problem loading more reminders.",
          variant: "destructive"
        });
      });
    }
  }, [hasMore, loading, loadMoreReminders, toast]);

  // Handle clearing a single completed reminder
  const handleClearCompleted = useCallback((id: string) => {
    if (deleteReminder) {
      console.log("Clearing completed reminder:", id);
      deleteReminder(id).catch(error => {
        console.error("Error clearing completed reminder:", error);
        toast({
          title: "Error Removing Reminder",
          description: "There was a problem removing the completed reminder.",
          variant: "destructive"
        });
      });
    }
  }, [deleteReminder, toast]);

  // Handle clearing all completed reminders
  const handleClearAllCompleted = useCallback(() => {
    if (completedReminders.length > 0 && batchDeleteReminders) {
      const completedIds = completedReminders.map(reminder => reminder.id);
      console.log("Clearing all completed reminders:", completedIds);
      
      batchDeleteReminders(completedIds).catch(error => {
        console.error("Error clearing all completed reminders:", error);
        toast({
          title: "Error Clearing Reminders",
          description: "There was a problem removing the completed reminders.",
          variant: "destructive"
        });
      });
    }
  }, [completedReminders, batchDeleteReminders, toast]);

  // Handle dashboard modals with enhanced logging
  const { 
    modalComponents, 
    openQuickReminderModal, 
    openVoiceRecorderModal 
  } = DashboardModalHandler({
    addReminder: async (reminder) => {
      console.log("Adding new reminder from modal:", reminder);
      try {
        const savedReminder = await addReminder(reminder);
        console.log("Successfully saved reminder from modal:", savedReminder);
        return savedReminder;
      } catch (error) {
        console.error("Error adding reminder from modal:", error);
        throw error;
      }
    },
    refreshReminders: async () => {
      console.log("Refreshing reminders after modal action");
      try {
        const success = await refreshReminders();
        console.log("Refresh result from modal:", success);
        return success;
      } catch (error) {
        console.error("Error refreshing reminders in modal handler:", error);
        return false;
      }
    },
    useMockData: useMockData
  });

  return (
    <DashboardLayout>
      <DashboardHeader pageTitle="Tempo Dashboard" stats={reminderStats} />
      
      {!hasFirestorePermissions && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
          <div className="flex items-start">
            <div className="ml-3">
              <p className="text-sm text-amber-700 font-medium">
                Firestore API Not Configured
              </p>
              <p className="mt-1 text-sm text-amber-600">
                The Firestore API needs to be enabled for this project. Visit the Firebase Console
                to enable the Firestore API for project: tempowizard-ac888
              </p>
            </div>
          </div>
        </div>
      )}
      
      <DashboardContent 
        urgentReminders={urgentReminders}
        upcomingReminders={upcomingReminders}
        completedReminders={completedReminders}
        onCompleteReminder={handleBatchedCompleteReminder}
        onUndoComplete={handleUndoComplete}
        onNewReminder={openQuickReminderModal}
        onNewVoiceNote={openVoiceRecorderModal}
        onUpdateReminder={handleBatchedReminderUpdated}
        onClearAllCompleted={handleClearAllCompleted}
        onClearCompleted={handleClearCompleted}
        isLoading={loading}
        hasError={hasError}
        hasMoreReminders={hasMore}
        totalCount={totalCount}
        loadedCount={reminders.length}
        onLoadMore={handleLoadMore}
        isRefreshing={isRefreshing}
      />
      
      {modalComponents}
    </DashboardLayout>
  );
};

export default DashboardMain;
