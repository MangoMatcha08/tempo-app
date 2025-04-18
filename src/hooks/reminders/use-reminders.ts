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
import { handleFirestoreError } from "@/lib/firebase/firestore";

// Cache control
const FETCH_COOLDOWN = 30000; // 30 seconds between refreshes
let lastFetchTimestamp = 0;

export function useReminders() {
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { db, isReady, error: firestoreError, useMockData: contextUseMockData, registerNeededIndex } = useFirestore();
  
  useEffect(() => {
    if (firestoreError) {
      console.error("Firestore error detected:", firestoreError);
      
      // Check if it's an index error
      const errorDetails = handleFirestoreError(firestoreError);
      if (errorDetails.isIndexError && errorDetails.indexUrl) {
        // Register the needed index
        registerNeededIndex('reminders', errorDetails.indexUrl);
      }
      
      setError(firestoreError);
    }
  }, [firestoreError, registerNeededIndex]);
  
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
    loadReminderDetail,
    useMockData
  } = useReminderQuery(user, db, isReady, contextUseMockData);
  
  useEffect(() => {
    if (queryError) {
      console.error("Query error detected:", queryError);
      
      // Check if it's an index error
      const errorDetails = handleFirestoreError(queryError);
      if (errorDetails.isIndexError && errorDetails.indexUrl) {
        // Register the needed index
        registerNeededIndex('reminders', errorDetails.indexUrl);
      }
      
      setError(queryError);
    }
  }, [queryError, registerNeededIndex]);
  
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
    deleteReminder: deleteReminderBase,
    error: operationsError,
    batchCompleteReminders: batchCompleteRemindersBase,
    batchAddReminders: batchAddRemindersBase,
    batchUpdateReminders: batchUpdateRemindersBase,
    batchDeleteReminders: batchDeleteRemindersBase
  } = useReminderOperations(user, db, isReady);
  
  useEffect(() => {
    if (operationsError) {
      console.error("Operations error detected:", operationsError);
      
      // Check if it's an index error
      const errorDetails = handleFirestoreError(operationsError);
      if (errorDetails.isIndexError && errorDetails.indexUrl) {
        // Register the needed index
        registerNeededIndex('reminders', errorDetails.indexUrl);
      }
      
      setError(operationsError);
    }
  }, [operationsError, registerNeededIndex]);
  
  useEffect(() => {
    // Only fetch if enough time has passed since last fetch
    const now = Date.now();
    if (now - lastFetchTimestamp > FETCH_COOLDOWN) {
      const timer = setTimeout(() => {
        console.log("Initiating initial fetch of reminders");
        lastFetchTimestamp = now;
        fetchReminders()
          .then(() => console.log("Initial fetch completed successfully"))
          .catch(err => {
            console.error("Error in initial fetch:", err);
            
            // Check if it's an index error
            const errorDetails = handleFirestoreError(err);
            if (errorDetails.isIndexError && errorDetails.indexUrl) {
              // Register the needed index
              registerNeededIndex('reminders', errorDetails.indexUrl);
            }
            
            setError(err);
          });
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log(`Skipping fetch, last fetch was ${(now - lastFetchTimestamp)/1000} seconds ago`);
    }
  }, [fetchReminders, registerNeededIndex]);
  
  const handleCompleteReminder = useCallback((id: string) => {
    console.log("Completing reminder:", id);
    return completeReminderBase(id, setReminders);
  }, [completeReminderBase]);
  
  const handleUndoComplete = useCallback((id: string) => {
    console.log("Undoing completion for reminder:", id);
    return undoCompleteBase(id, setReminders);
  }, [undoCompleteBase]);
  
  const addReminder = useCallback((reminder: any) => {
    console.log("Adding new reminder:", reminder);
    return addReminderBase(reminder, setReminders, setTotalCount);
  }, [addReminderBase, setTotalCount]);
  
  const updateReminder = useCallback((reminder: any) => {
    console.log("Updating reminder:", reminder);
    return updateReminderBase(reminder, setReminders);
  }, [updateReminderBase]);
  
  const deleteReminder = useCallback((id: string) => {
    console.log("Deleting reminder:", id);
    return deleteReminderBase(id, setReminders, setTotalCount);
  }, [deleteReminderBase, setTotalCount]);
  
  const getDetailedReminder = useCallback((id: string) => {
    console.log("Getting detailed reminder:", id);
    return loadReminderDetail(id);
  }, [loadReminderDetail]);
  
  const batchCompleteReminders = useCallback((ids: string[], completed: boolean) => {
    console.log("Batch completing reminders:", ids, "completed:", completed);
    return batchCompleteRemindersBase(ids, completed, setReminders);
  }, [batchCompleteRemindersBase, setReminders]);
  
  const batchAddReminders = useCallback((reminders: Omit<BackendReminder, 'id'>[]) => {
    console.log("Batch adding reminders:", reminders);
    return batchAddRemindersBase(reminders, setReminders, setTotalCount);
  }, [batchAddRemindersBase, setReminders, setTotalCount]);
  
  const batchUpdateReminders = useCallback((reminders: BackendReminder[]) => {
    console.log("Batch updating reminders:", reminders);
    return batchUpdateRemindersBase(reminders, setReminders);
  }, [batchUpdateRemindersBase, setReminders]);
  
  const batchDeleteReminders = useCallback((ids: string[]) => {
    console.log("Batch deleting reminders:", ids);
    return batchDeleteRemindersBase(ids, setReminders, setTotalCount);
  }, [batchDeleteRemindersBase, setReminders, setTotalCount]);
  
  const refreshReminders = useCallback(async (): Promise<boolean> => {
    console.log("Refreshing reminders");
    
    const now = Date.now();
    // Only refresh if enough time has passed since last fetch
    if (now - lastFetchTimestamp < FETCH_COOLDOWN) {
      console.log(`Skipping refresh, last fetch was ${(now - lastFetchTimestamp)/1000} seconds ago`);
      return true; // Return success without fetching
    }
    
    try {
      lastFetchTimestamp = now;
      await refreshRemindersBase();
      console.log("Reminders refreshed successfully");
      return true;
    } catch (err) {
      console.error("Error refreshing reminders:", err);
      
      // Check if it's an index error
      const errorDetails = handleFirestoreError(err);
      if (errorDetails.isIndexError && errorDetails.indexUrl) {
        // Register the needed index
        registerNeededIndex('reminders', errorDetails.indexUrl);
      }
      
      return false;
    }
  }, [refreshRemindersBase, registerNeededIndex]);
  
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
    deleteReminder,
    loadMoreReminders,
    refreshReminders,
    hasMore,
    totalCount,
    setTotalCount,
    getDetailedReminder,
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders,
    useMockData
  };
}
