
import { useState } from "react";
import { Reminder } from "@/types/reminderTypes";
import { useSingleReminderOperations } from "./operations-single";
import { useBatchReminderOperations } from "./operations-batch";
import { useReminderOperationsCore } from "./operations-core";
import { useOptimisticOperations } from "./use-optimistic-operations";
import { useReminderCache } from "./use-reminder-cache";

/**
 * Main hook for all reminder operations
 * Now with optimistic UI updates and improved caching
 */
export function useReminderOperations(user: any, db: any, isReady: boolean) {
  const { error, setError } = useReminderOperationsCore(user, db, isReady);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { saveCache, getCacheStats } = useReminderCache();
  
  // Optimistic operations
  const {
    optimisticCreateReminder,
    optimisticUpdateReminder,
    optimisticDeleteReminder,
    optimisticCompleteReminder,
    optimisticUncompleteReminder,
    isReminderPending,
    pendingReminders
  } = useOptimisticOperations();
  
  // Single reminder operations
  const {
    handleCompleteReminder: baseHandleCompleteReminder,
    handleUndoComplete: baseHandleUndoComplete,
    addReminder: baseAddReminder,
    updateReminder: baseUpdateReminder,
    deleteReminder: baseDeleteReminder
  } = useSingleReminderOperations(user, db, isReady);
  
  // Batch reminder operations
  const {
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  } = useBatchReminderOperations(user, db, isReady);
  
  // Optimistic wrapper for completing a reminder
  const handleCompleteReminder = async (id: string) => {
    return optimisticCompleteReminder(
      id, 
      setReminders,
      async (id: string) => {
        return baseHandleCompleteReminder(id, setReminders);
      }
    );
  };
  
  // Optimistic wrapper for undoing a completion
  const handleUndoComplete = async (id: string) => {
    return optimisticUncompleteReminder(
      id,
      setReminders,
      async (id: string) => {
        return baseHandleUndoComplete(id, setReminders);
      }
    );
  };
  
  // Optimistic wrapper for adding a reminder
  const addReminder = async (reminder: Reminder) => {
    return optimisticCreateReminder(
      reminder,
      setReminders,
      setTotalCount,
      async (reminder: Reminder) => {
        return baseAddReminder(reminder, setReminders, setTotalCount);
      }
    );
  };
  
  // Optimistic wrapper for updating a reminder
  const updateReminder = async (updatedReminder: Reminder) => {
    return optimisticUpdateReminder(
      updatedReminder,
      setReminders,
      async (reminder: Reminder) => {
        return baseUpdateReminder(reminder, setReminders);
      }
    );
  };
  
  // Optimistic wrapper for deleting a reminder
  const deleteReminder = async (id: string) => {
    return optimisticDeleteReminder(
      id,
      setReminders,
      setTotalCount,
      async (id: string) => {
        return baseDeleteReminder(id, setReminders, setTotalCount);
      }
    );
  };

  // Save cache on operations that change data
  const saveAfterOperation = async () => {
    try {
      await saveCache();
      console.log("Cache saved after operation:", getCacheStats());
    } catch (err) {
      console.error("Error saving cache after operation:", err);
    }
  };

  return {
    // Single operations with optimistic UI
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
    
    // State management
    reminders,
    setReminders,
    totalCount,
    setTotalCount,
    
    // Pending operations status
    isReminderPending,
    pendingReminders,
    
    // Error state
    error,
    
    // Cache management
    saveCache: saveAfterOperation
  };
}
