
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useReminderCache } from "./use-reminder-cache";
import { doc, Timestamp, writeBatch } from "firebase/firestore";
import { isQuotaError } from "@/lib/firebase/error-utils";
import { toFirestoreTimestamp } from "@/lib/firebase/dateConversions";
import { toPSTTime } from "@/utils/dateTimeUtils";

/**
 * Core hook for reminder operations, providing shared state and utilities
 */
export function useReminderOperationsCore(user: any, db: any, isReady: boolean) {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const { 
    cacheReminder, 
    invalidateReminder,
    invalidateUserCache
  } = useReminderCache();

  // Helper to prepare dates for Firestore
  const prepareReminderDates = (reminder: any) => {
    if (!reminder) return reminder;
    
    const result = { ...reminder };
    
    // Convert dates to Firestore Timestamps
    if (result.dueDate) {
      result.dueDate = toFirestoreTimestamp(result.dueDate);
    }
    
    if (result.createdAt) {
      result.createdAt = toFirestoreTimestamp(result.createdAt);
    }
    
    if (result.completedAt) {
      result.completedAt = toFirestoreTimestamp(result.completedAt);
    }
    
    return result;
  };
  
  // Helper to ensure dates are in PST timezone
  const ensurePSTDates = (reminder: any) => {
    if (!reminder) return reminder;
    
    const result = { ...reminder };
    
    // Convert dates to PST timezone
    if (result.dueDate) {
      result.dueDate = toPSTTime(result.dueDate);
    }
    
    if (result.createdAt) {
      result.createdAt = toPSTTime(result.createdAt);
    }
    
    if (result.completedAt && result.completedAt instanceof Date) {
      result.completedAt = toPSTTime(result.completedAt);
    }
    
    return result;
  };

  // Helper to check if we're in offline mode
  const isOfflineMode = () => {
    if (!user || !isReady || !db) {
      console.log("No Firestore connection, operating in offline mode");
      return true;
    }
    return false;
  };

  // Helper for creating error toasts
  const showErrorToast = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  // Helper for handling quota errors
  const handleQuotaError = (err: any) => {
    if (isQuotaError(err)) {
      console.log("Quota exceeded error detected");
      toast({
        title: "Firebase Quota Exceeded",
        description: "Daily quota limit reached. Some operations may be unavailable.",
        variant: "destructive",
        duration: 6000,
      });
      return true;
    }
    return false;
  };

  // Enhanced error handling with cache invalidation
  const handleOperationError = (err: any, affectedIds?: string[]) => {
    console.error("Operation error:", err);
    setError(err instanceof Error ? err : new Error(String(err)));
    
    // Invalidate affected reminders on error
    if (affectedIds?.length) {
      affectedIds.forEach(id => invalidateReminder(id));
      console.log("Invalidated cache for affected reminders:", affectedIds);
    }
    
    // If it's a quota error, invalidate all user cache as a precaution
    if (handleQuotaError(err)) {
      invalidateUserCache(user?.uid);
    }
    
    return false;
  };

  return {
    toast,
    error,
    setError,
    cacheReminder,
    invalidateReminder,
    invalidateUserCache,
    isOfflineMode,
    showErrorToast,
    handleQuotaError,
    handleOperationError,
    prepareReminderDates,
    ensurePSTDates
  };
}
