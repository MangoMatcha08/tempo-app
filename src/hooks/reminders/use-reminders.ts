import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useReminderQuery } from "./reminder-query";
import { useReminderFilters } from "./reminder-filters";
import { useReminderOperations } from "./reminder-operations";
import { Reminder as BackendReminder } from "@/types/reminderTypes";
import { calculateReminderStats } from "./reminder-stats";
import { 
  transformToUrgentReminders,
  transformToUpcomingReminders,
  transformToCompletedReminders
} from "./reminder-transformations";

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
    return calculateReminderStats(
      urgentBackendReminders,
      upcomingBackendReminders,
      completedBackendReminders
    );
  }, [urgentBackendReminders.length, upcomingBackendReminders.length, completedBackendReminders.length]);
  
  const urgentReminders = useMemo(() => {
    return transformToUrgentReminders(urgentBackendReminders);
  }, [urgentBackendReminders]);
  
  const upcomingReminders = useMemo(() => {
    return transformToUpcomingReminders(upcomingBackendReminders);
  }, [upcomingBackendReminders]);
  
  const completedReminders = useMemo(() => {
    return transformToCompletedReminders(completedBackendReminders);
  }, [completedBackendReminders]);

  return {
    reminders,
    setReminders,
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
    setTotalCount,
    getDetailedReminder,
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  };
}
