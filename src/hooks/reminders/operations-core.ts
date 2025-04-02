
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useReminderCache } from "./use-reminder-cache";
import { doc, Timestamp, writeBatch } from "firebase/firestore";
import { Reminder } from "@/types/reminderTypes";

/**
 * Core hook for reminder operations, providing shared state and utilities
 */
export function useReminderOperationsCore(user: any, db: any, isReady: boolean) {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);
  const { 
    getCachedReminderList, 
    cacheReminderList,
    cacheReminder,
    invalidateUserCache,
    invalidateReminder
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

  return {
    toast,
    error,
    setError,
    cacheReminder,
    invalidateUserCache,
    invalidateReminder,
    isOfflineMode,
    showErrorToast
  };
}
