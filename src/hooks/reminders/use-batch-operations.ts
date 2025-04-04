
import { useState, useCallback, useRef, useEffect } from "react";
import { Reminder } from "@/types/reminderTypes";

interface BatchOperationsProps {
  user: any;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  batchCompleteReminders: (
    ids: string[], 
    completed: boolean, 
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  ) => Promise<boolean>;
  batchUpdateReminders: (
    reminders: Reminder[], 
    setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  ) => Promise<boolean>;
}

export function useBatchOperations({
  user,
  setReminders,
  setTotalCount,
  batchCompleteReminders,
  batchUpdateReminders
}: BatchOperationsProps) {
  // Batch operations storage
  const completeOperationsRef = useRef<Set<string>>(new Set());
  const updateOperationsRef = useRef<Map<string, Reminder>>(new Map());
  const [isPending, setIsPending] = useState(false);
  
  // Timer for batch operations
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Batch size constants
  const BATCH_SIZE = 10;
  const BATCH_DELAY = 2000;

  // Add a reminder ID to the batch complete queue
  const addToBatchComplete = useCallback((id: string) => {
    console.log("Adding reminder to batch complete:", id);
    completeOperationsRef.current.add(id);
    scheduleBatchOperations();
  }, []);
  
  // Add a reminder to the batch update queue
  const addToBatchUpdate = useCallback((reminder: Reminder) => {
    console.log("Adding reminder to batch update:", reminder.id);
    updateOperationsRef.current.set(reminder.id, reminder);
    scheduleBatchOperations();
  }, []);
  
  // Schedule batch operations to run after a delay
  const scheduleBatchOperations = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }
    
    batchTimerRef.current = setTimeout(() => {
      processBatchOperations();
    }, BATCH_DELAY);
  }, []);
  
  // Process all pending batch operations
  const processBatchOperations = useCallback(async () => {
    if (isPending) {
      console.log("Batch operations already in progress, deferring");
      scheduleBatchOperations();
      return;
    }
    
    // Get complete operations
    const completeIds = Array.from(completeOperationsRef.current);
    
    // Get update operations
    const updateReminders = Array.from(updateOperationsRef.current.values());
    
    // Skip if no operations
    if (completeIds.length === 0 && updateReminders.length === 0) {
      console.log("No pending batch operations");
      return;
    }
    
    console.log("Processing batch operations:", {
      completeCount: completeIds.length,
      updateCount: updateReminders.length
    });
    
    setIsPending(true);
    
    try {
      // Process complete operations in batches
      if (completeIds.length > 0) {
        // Process in chunks if needed
        for (let i = 0; i < completeIds.length; i += BATCH_SIZE) {
          const batch = completeIds.slice(i, i + BATCH_SIZE);
          await batchCompleteReminders(batch, true, setReminders);
        }
        
        // Clear processed IDs
        completeOperationsRef.current.clear();
      }
      
      // Process update operations in batches
      if (updateReminders.length > 0) {
        // Process in chunks if needed
        for (let i = 0; i < updateReminders.length; i += BATCH_SIZE) {
          const batch = updateReminders.slice(i, i + BATCH_SIZE);
          await batchUpdateReminders(batch, setReminders);
        }
        
        // Clear processed reminders
        updateOperationsRef.current.clear();
      }
      
      console.log("Batch operations completed successfully");
    } catch (error) {
      console.error("Error processing batch operations:", error);
    } finally {
      setIsPending(false);
    }
  }, [isPending, batchCompleteReminders, batchUpdateReminders, setReminders]);
  
  // Cleanup function
  const cleanupBatchOperations = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    
    // If there are pending operations, process them before unmounting
    if (completeOperationsRef.current.size > 0 || updateOperationsRef.current.size > 0) {
      processBatchOperations();
    }
  }, [processBatchOperations]);
  
  // Process any pending operations before unmounting
  useEffect(() => {
    return () => {
      cleanupBatchOperations();
    };
  }, [cleanupBatchOperations]);
  
  return {
    addToBatchComplete,
    addToBatchUpdate,
    cleanupBatchOperations,
    isPending
  };
}
