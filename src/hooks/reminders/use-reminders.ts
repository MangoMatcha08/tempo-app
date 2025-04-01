
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
      setError(firestoreError);
    }
  }, [firestoreError]);
  
  // Use our modular hooks
  const {
    reminders,
    setReminders,
    loading,
    totalCount,
    setTotalCount,
    hasMore,
    fetchReminders,
    loadMoreReminders,
    refreshReminders
  } = useReminderQuery(user, db, isReady);
  
  const {
    urgentReminders,
    upcomingReminders,
    completedReminders
  } = useReminderFilters(reminders);
  
  const {
    handleCompleteReminder: completeReminderBase,
    handleUndoComplete: undoCompleteBase,
    addReminder: addReminderBase,
    updateReminder: updateReminderBase
  } = useReminderOperations(user, db, isReady);
  
  // Initialize data fetch
  useEffect(() => {
    fetchReminders();
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
