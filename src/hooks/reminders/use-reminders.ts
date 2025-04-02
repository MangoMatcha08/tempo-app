import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useReminderQuery } from "./reminder-query";
import { useReminderFilters } from "./reminder-filters";
import { useReminderOperations } from "./reminder-operations";
import { Reminder as BackendReminder, ReminderPriority } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";
import { ensureValidPriority } from "@/utils/typeUtils";

// Helper functions for data transformations
function getRemainingTimeDisplay(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 0) return "Overdue";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

function getTimeAgoDisplay(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function useReminders() {
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { db, isReady, error: firestoreError } = useFirestore();
  
  useEffect(() => {
    if (firestoreError) {
      console.error("Firestore error detected:", firestoreError);
      setError(firestoreError);
    }
  }, [firestoreError]);
  
  const {
    reminders,
    setReminders,
    loading,
    error: queryError,
    totalCount,
    setTotalCount,
    hasMore,
    isRefreshing,
    fetchReminders,
    loadMoreReminders,
    refreshReminders: refreshRemindersBase,
    loadReminderDetail
  } = useReminderQuery(user, db, isReady);
  
  useEffect(() => {
    if (queryError) {
      console.error("Query error detected:", queryError);
      setError(queryError);
    }
  }, [queryError]);
  
  const {
    urgentReminders: urgentBackendReminders,
    upcomingReminders: upcomingBackendReminders,
    completedReminders: completedBackendReminders
  } = useReminderFilters(reminders);
  
  const {
    handleCompleteReminder: completeReminderBase,
    handleUndoComplete: undoCompleteBase,
    addReminder: addReminderBase,
    updateReminder: updateReminderBase,
    error: operationsError,
    batchCompleteReminders: batchCompleteRemindersBase,
    batchAddReminders: batchAddRemindersBase,
    batchUpdateReminders: batchUpdateRemindersBase,
    batchDeleteReminders: batchDeleteRemindersBase
  } = useReminderOperations(user, db, isReady);
  
  useEffect(() => {
    if (operationsError) {
      console.error("Operations error detected:", operationsError);
      setError(operationsError);
    }
  }, [operationsError]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReminders().catch(err => {
        console.error("Error in initial fetch:", err);
        setError(err);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchReminders]);
  
  const handleCompleteReminder = useCallback((id: string) => {
    return completeReminderBase(id, setReminders);
  }, [completeReminderBase]);
  
  const handleUndoComplete = useCallback((id: string) => {
    return undoCompleteBase(id, setReminders);
  }, [undoCompleteBase]);
  
  const addReminder = useCallback((reminder: any) => {
    return addReminderBase(reminder, setReminders, setTotalCount);
  }, [addReminderBase, setTotalCount]);
  
  const updateReminder = useCallback((reminder: any) => {
    return updateReminderBase(reminder, setReminders);
  }, [updateReminderBase]);
  
  const getDetailedReminder = useCallback((id: string) => {
    return loadReminderDetail(id);
  }, [loadReminderDetail]);
  
  const batchCompleteReminders = useCallback((ids: string[], completed: boolean) => {
    return batchCompleteRemindersBase(ids, completed, setReminders);
  }, [batchCompleteRemindersBase]);
  
  const batchAddReminders = useCallback((reminders: Omit<BackendReminder, 'id'>[]) => {
    return batchAddRemindersBase(reminders, setReminders, setTotalCount);
  }, [batchAddRemindersBase, setTotalCount]);
  
  const batchUpdateReminders = useCallback((reminders: BackendReminder[]) => {
    return batchUpdateRemindersBase(reminders, setReminders);
  }, [batchUpdateRemindersBase]);
  
  const batchDeleteReminders = useCallback((ids: string[]) => {
    return batchDeleteRemindersBase(ids, setReminders, setTotalCount);
  }, [batchDeleteRemindersBase, setTotalCount]);
  
  const refreshReminders = useCallback(async (): Promise<boolean> => {
    try {
      await refreshRemindersBase();
      return true;
    } catch (err) {
      console.error("Error refreshing reminders:", err);
      return false;
    }
  }, [refreshRemindersBase]);
  
  const reminderStats = useMemo(() => {
    const totalActive = urgentBackendReminders.length + upcomingBackendReminders.length;
    const totalCompleted = completedBackendReminders.length;
    const completionRate = (totalReminders: number) => 
      totalReminders > 0 ? Math.round((totalCompleted / totalReminders) * 100) : 0;
    
    return {
      totalActive,
      totalCompleted,
      totalReminders: totalActive + totalCompleted,
      completionRate: completionRate(totalActive + totalCompleted),
      urgentCount: urgentBackendReminders.length,
      upcomingCount: upcomingBackendReminders.length
    };
  }, [urgentBackendReminders.length, upcomingBackendReminders.length, completedBackendReminders.length]);
  
  const urgentReminders = useMemo(() => {
    console.log("Transforming urgent reminders");
    return urgentBackendReminders.map(reminder => {
      const priority = ensureValidPriority(reminder.priority);
      
      return {
        ...reminder,
        priority,
        timeRemaining: getRemainingTimeDisplay(reminder.dueDate),
        formattedDate: formatDate(reminder.dueDate)
      } as UIReminder & { timeRemaining: string, formattedDate: string };
    });
  }, [urgentBackendReminders]);
  
  const upcomingReminders = useMemo(() => {
    console.log("Transforming upcoming reminders");
    return upcomingBackendReminders.map(reminder => {
      const priority = ensureValidPriority(reminder.priority);
      
      return {
        ...reminder,
        priority,
        timeRemaining: getRemainingTimeDisplay(reminder.dueDate),
        formattedDate: formatDate(reminder.dueDate)
      } as UIReminder & { timeRemaining: string, formattedDate: string };
    });
  }, [upcomingBackendReminders]);
  
  const completedReminders = useMemo(() => {
    console.log("Transforming completed reminders");
    return completedBackendReminders.map(reminder => {
      const priority = ensureValidPriority(reminder.priority);
      
      return {
        ...reminder,
        priority,
        completedTimeAgo: reminder.completedAt ? getTimeAgoDisplay(reminder.completedAt) : '',
        formattedDate: formatDate(reminder.dueDate)
      } as UIReminder & { completedTimeAgo: string, formattedDate: string };
    });
  }, [completedBackendReminders]);

  return {
    reminders,
    loading,
    error,
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
    getDetailedReminder,
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  };
}
