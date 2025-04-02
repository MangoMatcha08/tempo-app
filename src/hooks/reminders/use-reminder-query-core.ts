
import { useState, useCallback } from "react";
import { Reminder } from "@/types/reminderTypes";
import { useToast } from "@/hooks/use-toast";
import { useReminderCache } from "./use-reminder-cache";
import { getFirestoreIndexCreationUrl, REMINDERS_COLLECTION } from "@/lib/firebase";
import { useFirestoreIndexes } from "./use-firestore-indexes";

// Constants for performance tuning
export const BATCH_SIZE = 10;
export const REFRESH_DEBOUNCE_MS = 300; // More aggressive debouncing for refreshes
export const MAX_RETRY_ATTEMPTS = 1; // Only retry once to avoid excessive waiting

// Generate mock reminders for demo purposes
export const generateMockReminders = (count = 5): Reminder[] => {
  const mockTitles = [
    "Grade student essays", 
    "Prepare for tomorrow's lesson",
    "Submit quarterly report",
    "Schedule parent-teacher meetings",
    "Order new classroom supplies",
    "Update curriculum documents",
    "Check in with struggling students",
    "Organize field trip logistics"
  ];
  
  const mockPriorities = ["high", "medium", "low"];
  
  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + Math.floor(Math.random() * 7)); // Random due date within a week
    
    return {
      id: `mock-${i + 1}`,
      title: mockTitles[i % mockTitles.length],
      description: `This is a mock reminder #${i + 1} for demonstration purposes.`,
      dueDate,
      priority: mockPriorities[i % mockPriorities.length] as any,
      createdAt: now,
      completed: i % 4 === 0, // Make some completed
      userId: 'mock-user-id'
    } as Reminder;
  });
};

// Helper to check for permission errors
export const isPermissionError = (err: any): boolean => {
  const errorMessage = String(err);
  return (
    errorMessage.includes('permission-denied') || 
    errorMessage.includes('not been used') || 
    errorMessage.includes('disabled')
  );
};

/**
 * Core hook providing shared state and utilities for reminder querying
 */
export function useReminderQueryCore(user: any, db: any, isReady: boolean) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const { toast } = useToast();
  const { handleQueryError } = useFirestoreIndexes();
  
  // Get the collection path for reminders
  const getRemindersCollectionPath = useCallback(() => {
    return REMINDERS_COLLECTION;
  }, []);
  
  // Helper to show error toast
  const showErrorToast = useCallback((title: string, description: string, variant: "default" | "destructive" = "destructive") => {
    toast({
      title,
      description,
      variant,
      duration: 5000,
    });
  }, [toast]);
  
  return {
    loading,
    setLoading,
    error,
    setError,
    totalCount,
    setTotalCount,
    lastRefreshTime,
    setLastRefreshTime,
    isRefreshing,
    setIsRefreshing,
    retryAttempts,
    setRetryAttempts,
    toast,
    handleQueryError,
    getRemindersCollectionPath,
    showErrorToast
  };
}
