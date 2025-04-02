
import { useCallback, useRef } from "react";
import { Reminder as UIReminder } from "@/types/reminder";
import { convertToBackendReminder } from "@/utils/typeUtils";

/**
 * Hook for efficiently handling batched reminder operations
 */
export function useBatchOperations(
  batchCompleteReminders: (ids: string[], completed: boolean) => Promise<boolean>,
  batchDeleteReminders: (ids: string[]) => Promise<boolean>,
  batchUpdateReminders: (reminders: any[]) => Promise<boolean>
) {
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
  const addToBatchUpdate = useCallback((reminder: UIReminder) => {
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
