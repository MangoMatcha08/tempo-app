
import { useState } from "react";
import { Reminder } from "@/types/reminderTypes";
import { useSingleReminderOperations } from "./operations-single";
import { useBatchReminderOperations } from "./operations-batch";
import { useReminderOperationsCore } from "./operations-core";

/**
 * Main hook for all reminder operations
 */
export function useReminderOperations(user: any, db: any, isReady: boolean) {
  const { error, setError } = useReminderOperationsCore(user, db, isReady);
  
  // Single reminder operations
  const {
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    deleteReminder
  } = useSingleReminderOperations(user, db, isReady);
  
  // Batch reminder operations
  const {
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  } = useBatchReminderOperations(user, db, isReady);

  return {
    // Single operations
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    deleteReminder,
    
    // Batch operations
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders,
    
    // Error state
    error
  };
}
