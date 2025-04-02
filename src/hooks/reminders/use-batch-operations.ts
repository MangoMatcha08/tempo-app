
import { useCallback, useRef } from "react";
import { Reminder } from "@/types/reminderTypes"; 
import { useBatchReminderOperations } from "./operations-batch";

/**
 * Hook for efficiently handling batched reminder operations
 */
export function useBatchOperations(
  user: any, 
  db: any, 
  isReady: boolean,
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>,
  setTotalCount: React.Dispatch<React.SetStateAction<number>>
) {
  // Get batch operations from our new specialized hook
  const {
    batchCompleteReminders,
    batchDeleteReminders,
    batchUpdateReminders
  } = useBatchReminderOperations(user, db, isReady);
  
  // Reference to store reminders pending batch operations
  const pendingBatchRef = useRef<{
    complete: string[];
    delete: string[];
    update: Reminder[];
  }>({
    complete: [],
    delete: [],
    update: []
  });
  
  // Batch operation timeout reference
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Process batch operations
  const processBatchOperations = useCallback(async () => {
    const { complete, delete: deleteBatch, update } = pendingBatchRef.current;
    let allSuccessful = true;
    
    // Process completing reminders
    if (complete.length > 0) {
      console.log(`Processing batch complete for ${complete.length} reminders`);
      try {
        const success = await batchCompleteReminders(complete, true, setReminders);
        if (success) {
          console.log("Batch complete operation successful");
        } else {
          console.error("Batch complete operation returned false");
          allSuccessful = false;
        }
      } catch (error) {
        console.error("Batch complete operation failed:", error);
        allSuccessful = false;
      }
      
      // Clear the batch
      pendingBatchRef.current.complete = [];
    }
    
    // Process deleting reminders
    if (deleteBatch.length > 0) {
      console.log(`Processing batch delete for ${deleteBatch.length} reminders`);
      try {
        const success = await batchDeleteReminders(deleteBatch, setReminders, setTotalCount);
        if (success) {
          console.log("Batch delete operation successful");
        } else {
          console.error("Batch delete operation returned false");
          allSuccessful = false;
        }
      } catch (error) {
        console.error("Batch delete operation failed:", error);
        allSuccessful = false;
      }
      
      // Clear the batch
      pendingBatchRef.current.delete = [];
    }
    
    // Process updating reminders
    if (update.length > 0) {
      console.log(`Processing batch update for ${update.length} reminders`);
      
      try {
        const success = await batchUpdateReminders(update, setReminders);
        if (success) {
          console.log("Batch update operation successful");
        } else {
          console.error("Batch update operation returned false");
          allSuccessful = false;
        }
      } catch (error) {
        console.error("Batch update operation failed:", error);
        allSuccessful = false;
      }
      
      // Clear the batch
      pendingBatchRef.current.update = [];
    }
    
    // Clear the timeout reference
    batchTimeoutRef.current = null;
    
    return allSuccessful;
  }, [batchCompleteReminders, batchDeleteReminders, batchUpdateReminders, setReminders, setTotalCount]);
  
  // Function to schedule a batch operation
  const scheduleBatchOperation = useCallback(() => {
    // If there's already a timeout, don't schedule another one
    if (batchTimeoutRef.current !== null) return;
    
    // Schedule batch processing in 500ms to allow for multiple operations to be batched
    batchTimeoutRef.current = setTimeout(() => {
      processBatchOperations();
    }, 500);
  }, [processBatchOperations]);

  // Function to add a reminder to the completion batch
  const addToBatchComplete = useCallback((id: string) => {
    pendingBatchRef.current.complete.push(id);
    scheduleBatchOperation();
  }, [scheduleBatchOperation]);

  // Function to add a reminder to the deletion batch
  const addToBatchDelete = useCallback((id: string) => {
    pendingBatchRef.current.delete.push(id);
    scheduleBatchOperation();
  }, [scheduleBatchOperation]);

  // Function to add a reminder to the update batch
  const addToBatchUpdate = useCallback((reminder: Reminder) => {
    pendingBatchRef.current.update.push(reminder);
    scheduleBatchOperation();
  }, [scheduleBatchOperation]);

  // Cleanup function for unmounting
  const cleanupBatchOperations = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    // Process any pending operations before unmounting
    if (pendingBatchRef.current.complete.length > 0 ||
        pendingBatchRef.current.delete.length > 0 ||
        pendingBatchRef.current.update.length > 0) {
      processBatchOperations();
    }
  }, [processBatchOperations]);

  return {
    addToBatchComplete,
    addToBatchDelete,
    addToBatchUpdate,
    cleanupBatchOperations
  };
}
