import { useState, useEffect, useCallback } from "react";
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
  
  const {
    reminders,
    loading,
    isRefreshing,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    loadMoreReminders,
    refreshReminders,
    hasMore,
    totalCount,
    error: reminderError
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

  // Convert reminders to UI-compatible format with memoization
  const convertedUrgentReminders = urgentReminders.map(convertToUIReminder);
  const convertedUpcomingReminders = upcomingReminders.map(convertToUIReminder);
  const convertedCompletedReminders = completedReminders.map(convertToUIReminder);

  const handleReminderCreated = (reminder: UIReminder) => {
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    
    // Add the new reminder to the list
    addReminder(backendReminder)
      .then((savedReminder) => {
        console.log("Reminder saved successfully:", savedReminder);
        toast({
          title: "Reminder Created",
          description: `"${reminder.title}" has been added to your reminders.`
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
  };

  const handleReminderUpdated = (reminder: UIReminder) => {
    // Convert UI reminder to backend reminder type
    const backendReminder = convertToBackendReminder(reminder);
    
    // Update the reminder in the list
    updateReminder(backendReminder)
      .then(() => {
        toast({
          title: "Reminder Updated",
          description: `"${reminder.title}" has been updated.`
        });
        
        // Use refreshReminders for immediate update
        refreshReminders();
      })
      .catch(error => {
        console.error("Error updating reminder:", error);
        setHasError(true);
        toast({
          title: "Error Updating Reminder",
          description: "There was a problem updating your reminder.",
          variant: "destructive"
        });
      });
  };

  const handleLoadMore = () => {
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
  };

  // We're keeping the debugging/testing function call here but not exposing it in the UI
  // You can call clearCacheAndRefresh() in the console for testing
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
      <DashboardHeader title="Tempo Dashboard" />
      
      <DashboardContent 
        urgentReminders={convertedUrgentReminders}
        upcomingReminders={convertedUpcomingReminders}
        completedReminders={convertedCompletedReminders}
        onCompleteReminder={handleCompleteReminder}
        onUndoComplete={handleUndoComplete}
        onNewReminder={() => setShowQuickReminderModal(true)}
        onNewVoiceNote={() => setShowVoiceRecorderModal(true)}
        onUpdateReminder={handleReminderUpdated}
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
