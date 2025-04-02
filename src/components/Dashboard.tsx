
import { useState, useEffect, useCallback } from "react";
import { useReminders } from "@/hooks/reminders/use-reminders";
import { useToast } from "@/hooks/use-toast";
import { useBatchOperations } from "@/hooks/reminders/use-batch-operations";
import { useDashboardRefresh } from "@/hooks/reminders/use-dashboard-refresh";
import { useAuth } from "@/contexts/AuthContext";
import DashboardMain from "@/components/dashboard/DashboardMain";

const Dashboard = () => {
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
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
    batchUpdateReminders
  } = useReminders();

  // Update error state based on reminders hook error
  useEffect(() => {
    if (reminderError) {
      console.error("Reminder error detected:", reminderError);
      setHasError(true);
      
      // Show toast only for significant errors
      if (!loading && reminders.length === 0) {
        toast({
          title: "Error Loading Reminders",
          description: "There was an issue retrieving your reminders. Please try refreshing.",
          variant: "destructive",
        });
      }
    } else if (reminders.length > 0) {
      // Reset error state when reminders are loaded successfully
      setHasError(false);
    }
  }, [reminders, reminderError, loading, toast]);

  // Set up batch operations
  const {
    addToBatchComplete,
    addToBatchUpdate,
    cleanupBatchOperations
  } = useBatchOperations({
    user,
    setReminders,
    setTotalCount,
    batchCompleteReminders,
    batchUpdateReminders
  });

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

  // Enhanced reminder operations
  const handleAddReminder = useCallback(async (reminder: any) => {
    try {
      console.log("Adding reminder in Dashboard:", reminder);
      const result = await addReminder(reminder);
      
      // If we successfully added the reminder, show success toast
      if (result) {
        toast({
          title: "Reminder Added",
          description: `"${reminder.title}" has been added to your reminders.`
        });
        
        // Force refresh to ensure the UI is updated
        console.log("Forcing refresh after add");
        await refreshReminders();
      }
      
      return result;
    } catch (err) {
      console.error("Error adding reminder in Dashboard:", err);
      toast({
        title: "Error Adding Reminder",
        description: "There was a problem adding your reminder.",
        variant: "destructive"
      });
      throw err;
    }
  }, [addReminder, refreshReminders, toast]);

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

  return (
    <DashboardMain
      reminders={reminders}
      loading={loading}
      isRefreshing={isRefreshing}
      urgentReminders={urgentReminders}
      upcomingReminders={upcomingReminders}
      completedReminders={completedReminders}
      reminderStats={reminderStats}
      handleCompleteReminder={handleCompleteReminder}
      handleUndoComplete={handleUndoComplete}
      addReminder={handleAddReminder}
      updateReminder={updateReminder}
      loadMoreReminders={loadMoreReminders}
      refreshReminders={refreshReminders}
      hasMore={hasMore}
      totalCount={totalCount}
      hasError={hasError}
      addToBatchComplete={addToBatchComplete}
      addToBatchUpdate={addToBatchUpdate}
    />
  );
};

export default Dashboard;
