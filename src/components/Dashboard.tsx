
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
    batchUpdateReminders,
    batchDeleteReminders,
    deleteReminder
  } = useReminders();

  useEffect(() => {
    if (reminderError) {
      console.error("Reminder error detected:", reminderError);
      setHasError(true);
      
      if (!loading && reminders.length === 0) {
        toast({
          title: "Error Loading Reminders",
          description: "There was an issue retrieving your reminders. Please try refreshing.",
          variant: "destructive",
        });
      }
    } else if (reminders.length > 0) {
      setHasError(false);
    }
  }, [reminders, reminderError, loading, toast]);

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

  useEffect(() => {
    return () => {
      cleanupBatchOperations();
    };
  }, [cleanupBatchOperations]);

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

  const handleAddReminder = useCallback(async (reminder: any) => {
    try {
      console.log("Adding reminder in Dashboard:", reminder);
      const result = await addReminder(reminder);
      
      if (result) {
        toast({
          title: "Reminder Added",
          description: `"${reminder.title}" has been added to your reminders.`
        });
        
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

  const handleDeleteReminder = useCallback(async (id: string) => {
    try {
      console.log("Deleting reminder in Dashboard:", id);
      const result = await deleteReminder(id);
      
      if (result) {
        toast({
          title: "Reminder Removed",
          description: "The reminder has been successfully removed."
        });
      }
      
      return result;
    } catch (err) {
      console.error("Error deleting reminder in Dashboard:", err);
      toast({
        title: "Error Removing Reminder",
        description: "There was a problem removing the reminder.",
        variant: "destructive"
      });
      return false;
    }
  }, [deleteReminder, toast]);

  const handleBatchDeleteReminders = useCallback(async (ids: string[]) => {
    try {
      console.log("Batch deleting reminders in Dashboard:", ids);
      const result = await batchDeleteReminders(ids);
      
      if (result) {
        toast({
          title: "Reminders Cleared",
          description: `${ids.length} ${ids.length === 1 ? 'reminder' : 'reminders'} successfully removed.`
        });
      }
      
      return result;
    } catch (err) {
      console.error("Error batch deleting reminders in Dashboard:", err);
      toast({
        title: "Error Clearing Reminders",
        description: "There was a problem removing the reminders.",
        variant: "destructive"
      });
      return false;
    }
  }, [batchDeleteReminders, toast]);

  const clearCacheAndRefresh = useCallback(async () => {
    try {
      localStorage.removeItem('reminderCache');
      console.log("Reminder cache cleared");
      toast({
        title: "Cache Cleared",
        description: "Reminder cache has been cleared"
      });
      console.log("Initiating refresh after cache clear");
      const success = await refreshReminders();
      console.log("Refresh result after cache clear:", success);
      return success;
    } catch (err) {
      console.error("Error clearing cache:", err);
      return false;
    }
  }, [refreshReminders, toast]);

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
      deleteReminder={handleDeleteReminder}
      batchDeleteReminders={handleBatchDeleteReminders}
    />
  );
};

export default Dashboard;
