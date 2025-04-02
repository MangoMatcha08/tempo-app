
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useReminderQuery } from "./reminder-query";
import { useReminderFilters } from "./reminder-filters";
import { useReminderOperations } from "./reminder-operations";

export function useReminders() {
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { db, isReady, error: firestoreError } = useFirestore();
  
  // Handle Firestore errors
  useEffect(() => {
    if (firestoreError) {
      console.error("Firestore error detected:", firestoreError);
      setError(firestoreError);
    }
  }, [firestoreError]);
  
  // Use our modular hooks
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
    refreshReminders
  } = useReminderQuery(user, db, isReady);
  
  // Handle query errors
  useEffect(() => {
    if (queryError) {
      console.error("Query error detected:", queryError);
      setError(queryError);
    }
  }, [queryError]);
  
  const {
    urgentReminders,
    upcomingReminders,
    completedReminders
  } = useReminderFilters(reminders);
  
  const {
    handleCompleteReminder: completeReminderBase,
    handleUndoComplete: undoCompleteBase,
    addReminder: addReminderBase,
    updateReminder: updateReminderBase,
    error: operationsError
  } = useReminderOperations(user, db, isReady);
  
  // Handle operations errors
  useEffect(() => {
    if (operationsError) {
      console.error("Operations error detected:", operationsError);
      setError(operationsError);
    }
  }, [operationsError]);
  
  // Initialize data fetch - now with a small delay to improve perceived performance
  // and leverage cached data when available
  useEffect(() => {
    // Use a slight delay for initial load to let UI render first
    const timer = setTimeout(() => {
      fetchReminders().catch(err => {
        console.error("Error in initial fetch:", err);
        setError(err);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchReminders]);
  
  // Create wrapped versions of functions that already have setReminders bound
  const handleCompleteReminder = useCallback((id: string) => {
    return completeReminderBase(id, setReminders);
  }, [completeReminderBase]);
  
  const handleUndoComplete = useCallback((id: string) => {
    return undoCompleteBase(id, setReminders);
  }, [undoCompleteBase]);
  
  const addReminder = useCallback((reminder: any) => {
    return addReminderBase(reminder, setReminders, setTotalCount);
  }, [addReminderBase]);
  
  const updateReminder = useCallback((reminder: any) => {
    return updateReminderBase(reminder, setReminders);
  }, [updateReminderBase]);

  return {
    reminders,
    loading,
    error,
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
    totalCount
  };
}
