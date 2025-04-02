
import { useState, useEffect, useCallback } from "react";
import { useReminders } from "@/hooks/reminders/use-reminders";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { convertToBackendReminder } from "@/utils/typeUtils";
import { useBatchOperations } from "@/hooks/reminders/use-batch-operations";
import { useDashboardRefresh } from "@/hooks/reminders/use-dashboard-refresh";
import DashboardModalHandler from "@/components/dashboard/DashboardModalHandler";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestore } from "@/contexts/FirestoreContext";

// Constants for optimizing performance
const RETRY_DELAY = 1500; // Delay before retrying failed operations

const Dashboard = () => {
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasFirestorePermissions, useMockData } = useFirestore();
  
  const {
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
    setReminders,
    setTotalCount,
    error: reminderError,
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  } = useReminders();

  // Update error state based on reminders hook error
  useEffect(() => {
    if (reminderError) {
      console.error("Reminder error detected:", reminderError);
      setHasError(true);
    } else if (reminders.length > 0) {
      // Reset error state when reminders are loaded successfully
      setHasError(false);
    }
  }, [reminders, reminderError]);

  // Set up batch operations
  const {
    addToBatchComplete,
    addToBatchUpdate,
    cleanupBatchOperations
  } = useBatchOperations(
    user,
    setReminders,
    setTotalCount,
    batchCompleteReminders,
    batchUpdateReminders
  );

  // Clean up batch operations on unmount
  useEffect(() => {
    return () => {
      cleanupBatchOperations();
    };
  }, [cleanupBatchOperations]);

  // Set up dashboard refresh system
  const { forceRefresh } = useDashboardRefresh(
    async () => {
      try {
        const success = await refreshReminders();
        return success;
      } catch (error) {
        console.error("Error refreshing reminders:", error);
        return false;
      }
    },
    loading,
    hasError
  );

  // Function to clear the cache and refresh (for testing)
  const clearCacheAndRefresh = useCallback(() => {
    try {
      localStorage.removeItem('reminderCache');
      console.log("Reminder cache cleared");
      toast({
        title: "Cache Cleared",
        description: "Reminder cache has been cleared"
      });
      // Enhanced logging for debugging
      console.log("Initiating refresh after cache clear");
      return refreshReminders()
        .then(success => {
          console.log("Refresh result after cache clear:", success);
          return success;
        })
        .catch(err => {
          console.error("Error during refresh after cache clear:", err);
          return false;
        });
    } catch (err) {
      console.error("Error clearing cache:", err);
      return Promise.resolve(false);
    }
  }, [refreshReminders, toast]);

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
        setHasError(true);
        toast({
          title: "Error Loading Reminders",
          description: "There was a problem loading more reminders.",
          variant: "destructive"
        });
      });
    }
  }, [hasMore, loading, loadMoreReminders, toast]);

  // Expose cache clearing function to window object for testing in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).clearReminderCache = clearCacheAndRefresh;
      console.log("TIP: You can use window.clearReminderCache() to test the cache system");
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        delete (window as any).clearReminderCache;
      }
    };
  }, [clearCacheAndRefresh]);

  // Handle dashboard modals with enhanced logging
  const { 
    modalComponents, 
    openQuickReminderModal, 
    openVoiceRecorderModal 
  } = DashboardModalHandler({
    addReminder: (reminder) => {
      console.log("Adding new reminder from modal:", reminder);
      return addReminder(reminder);
    },
    refreshReminders: async () => {
      console.log("Refreshing reminders after modal action");
      try {
        const success = await refreshReminders();
        console.log("Refresh result:", success);
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
      <DashboardHeader title="Tempo Dashboard" stats={reminderStats} />
      
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

export default Dashboard;
