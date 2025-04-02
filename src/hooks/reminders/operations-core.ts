
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useReminderCache } from "./use-reminder-cache";
import { doc, Timestamp, writeBatch } from "firebase/firestore";
import { isQuotaError } from "@/lib/firebase/error-utils";

/**
 * Core hook for reminder operations, providing shared state and utilities
 */
export function useReminderOperationsCore(user: any, db: any, isReady: boolean) {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const { 
    cacheReminder, 
    invalidateReminder,
  } = useReminderCache();

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

  return {
    toast,
    error,
    setError,
    cacheReminder,
    invalidateReminder,
    isOfflineMode,
    showErrorToast,
    handleQuotaError
  };
}
