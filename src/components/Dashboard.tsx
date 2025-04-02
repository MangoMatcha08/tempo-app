import { useState, useEffect, useCallback, useRef } from "react";
import { useReminders } from "@/hooks/reminders/use-reminders";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardModals from "@/components/dashboard/DashboardModals";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Reminder as UIReminder } from "@/types/reminder";
import { useToast } from "@/hooks/use-toast";
import { convertToUIReminder, convertToBackendReminder } from "@/utils/typeUtils";

// Constants for optimizing refresh
const INITIAL_REFRESH_DELAY = 800; // Slight delay for initial render
const BACKGROUND_REFRESH_INTERVAL = 60000; // 60 seconds between background refreshes

const Dashboard = () => {
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();
  
  // Reference to store reminders pending batch operations
  const pendingBatchRef = useRef<{
    complete: string[];
    delete: string[];
    update: UIReminder[];
  }>({
    complete: [],
    delete: [],
    update: []
  });
  
  // Batch operation timeout reference
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    error: reminderError,
    // Batch operations
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

  // Function to clear the cache and refresh (for testing)
  const clearCacheAndRefresh = useCallback(() => {
    try {
      localStorage.removeItem('reminderCache');
      console.log("Reminder cache cleared");
      toast({
        title: "Cache Cleared",
        description: "Reminder cache has been cleared"
      });
      refreshReminders();
    } catch (err) {
      console.error("Error clearing cache:", err);
    }
  }, [refreshReminders, toast]);

  // Optimized background refresh with improved performance
  const performBackgroundRefresh = useCallback(async () => {
    if (!loading && !hasError) {
      try {
        await refreshReminders();
      } catch (error) {
        console.error("Background refresh error:", error);
        // Don't show an error toast for background refreshes
      }
    }
  }, [refreshReminders, loading, hasError]);

  // Set up periodic refresh with improved performance
  useEffect(() => {
    // Initial refresh after component mounts with a delay
    // to prioritize UI rendering first
    const initialRefreshTimer = setTimeout(() => {
      performBackgroundRefresh();
    }, INITIAL_REFRESH_DELAY);
    
    // Set up interval for background refresh
    const refreshInterval = setInterval(() => {
      performBackgroundRefresh();
    }, BACKGROUND_REFRESH_INTERVAL);
    
    return () => {
      clearTimeout(initialRefreshTimer);
      clearInterval(refreshInterval);
    };
  }, [performBackgroundRefresh]);
  
  // Process batch operations
  const processBatchOperations = useCallback(() => {
    const { complete, delete: deleteBatch, update } = pendingBatchRef.current;
    
    // Process completing reminders
    if (complete.length > 0) {
      console.log(`Processing batch complete for ${complete.length} reminders`);
      batchCompleteReminders(complete, true)
        .then(() => {
          console.log("Batch complete operation successful");
        })
        .catch(error => {
          console.error("Batch complete operation failed:", error);
        });
      
      // Clear the batch
      pendingBatchRef.current.complete = [];
    }
    
    // Process deleting reminders
    if (deleteBatch.length > 0) {
      console.log(`Processing batch delete for ${deleteBatch.length} reminders`);
      batchDeleteReminders(deleteBatch)
        .then(success => {
          if (success) {
            console.log("Batch delete operation successful");
          }
        })
        .catch(error => {
          console.error("Batch delete operation failed:", error);
        });
      
      // Clear the batch
      pendingBatchRef.current.delete = [];
    }
    
    // Process updating reminders
    if (update.length > 0) {
      console.log(`Processing batch update for ${update.length} reminders`);
      
      // Convert UI reminders to backend reminders
      const backendReminders = update.map(convertToBackendReminder);
      
      batchUpdateReminders(backendReminders)
        .then(() => {
          console.log("Batch update operation successful");
        })
        .catch(error => {
          console.error("Batch update operation failed:", error);
        });
      
      // Clear the batch
      pendingBatchRef.current.update = [];
    }
    
    // Clear the timeout reference
    batchTimeoutRef.current = null;
  }, [batchCompleteReminders, batchDeleteReminders, batchUpdateReminders]);
  
  // Function to schedule a batch operation
  const scheduleBatchOperation = useCallback(() => {
    // If there's already a timeout, don't schedule another one
    if (batchTimeoutRef.current !== null) return;
    
    // Schedule batch processing in 500ms to allow for multiple operations to be batched
    batchTimeoutRef.current = setTimeout(() => {
      processBatchOperations();
    }, 500);
  }, [processBatchOperations]);
  
  // Enhanced reminder operations with batching support
  const handleBatchedCompleteReminder = useCallback((id: string) => {
    // For immediate visual feedback, still call the individual operation
    handleCompleteReminder(id);
    
    // Add to batch for efficient processing
    pendingBatchRef.current.complete.push(id);
    scheduleBatchOperation();
  }, [handleCompleteReminder, scheduleBatchOperation]);
  
  const handleReminderCreated = useCallback((reminder: UIReminder) => {
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    
    // Add the new reminder to the list
    addReminder(backendReminder)
      .then((savedReminder) => {
        console.log("Reminder saved successfully:", savedReminder);
        toast({
          title: "Reminder Created",
          description: `"${reminder.title}" has been added to your reminders."
        });
        
        // Use refreshReminders instead of background refresh for immediate update
        refreshReminders();
      })
      .catch(error => {
        console.error("Error saving reminder:", error);
        setHasError(true);
        toast({
          title: "Error Saving Reminder",
          description: "There was a problem saving your reminder.",
          variant: "destructive"
        });
      });
  }, [addReminder, refreshReminders, toast]);
  
  const handleBatchedReminderUpdated = useCallback((reminder: UIReminder) => {
    // For immediate visual feedback, still call the individual operation
    updateReminder(convertToBackendReminder(reminder));
    
    // Add to batch for efficient processing
    pendingBatchRef.current.update.push(reminder);
    scheduleBatchOperation();
    
    toast({
      title: "Reminder Updated",
      description: `"${reminder.title}" has been updated.`
    });
  }, [updateReminder, scheduleBatchOperation, toast]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
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

  // Clean up batch timeouts on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // We're keeping the debugging/testing function call here but not exposing it in the UI
  useEffect(() => {
    // Expose the function to window for testing in development
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
    <DashboardLayout>
      <DashboardHeader title="Tempo Dashboard" stats={reminderStats} />
      
      <DashboardContent 
        urgentReminders={urgentReminders}
        upcomingReminders={upcomingReminders}
        completedReminders={completedReminders}
        onCompleteReminder={handleBatchedCompleteReminder}
        onUndoComplete={handleUndoComplete}
        onNewReminder={() => setShowQuickReminderModal(true)}
        onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
        onUpdateReminder={handleBatchedReminderUpdated}
        isLoading={loading}
        hasError={hasError}
        hasMoreReminders={hasMore}
        totalCount={totalCount}
        loadedCount={reminders.length}
        onLoadMore={handleLoadMore}
        isRefreshing={isRefreshing}
      />
      
      <DashboardModals 
        showQuickReminderModal={showQuickReminderModal}
        setShowQuickReminderModal={setShowQuickReminderModal}
        showVoiceRecorderModal={showVoiceRecorderModal}
        setShowVoiceRecorderModal={setShowVoiceRecorderModal}
        onReminderCreated={handleReminderCreated}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
