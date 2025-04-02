
import { Reminder as BackendReminder, ReminderPriority } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";

// Cache for formatted times
const timeFormatCache: Record<string, string> = {};

// Cache for priority conversions
const priorityCache: Record<string, ReminderPriority> = {
  "low": ReminderPriority.LOW,
  "medium": ReminderPriority.MEDIUM,
  "high": ReminderPriority.HIGH
};

/**
 * Format a date into a displayable time with caching for performance
 */
export function formatTime(date: Date, format: 'date' | 'time' | 'datetime' = 'datetime'): string {
  // Generate cache key
  const timestamp = date.getTime();
  const cacheKey = `${timestamp}_${format}`;
  
  // Check cache first
  if (timeFormatCache[cacheKey]) {
    return timeFormatCache[cacheKey];
  }
  
  // Format the time based on requested format
  let formattedTime: string;
  
  if (format === 'time') {
    formattedTime = date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (format === 'date') {
    formattedTime = date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  } else {
    formattedTime = date.toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Store in cache
  timeFormatCache[cacheKey] = formattedTime;
  
  return formattedTime;
}

/**
 * Ensure a priority value is valid
 */
export function ensureValidPriority(priority: ReminderPriority | string): ReminderPriority {
  if (priority in ReminderPriority) {
    return priority as ReminderPriority;
  }
  
  // Handle string values
  if (typeof priority === 'string') {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority in priorityCache) {
      return priorityCache[lowerPriority];
    }
  }
  
  // Default fallback
  return ReminderPriority.MEDIUM;
}

/**
 * Convert a backend reminder to a UI reminder
 */
export function convertToUIReminder(backendReminder: BackendReminder): UIReminder {
  return {
    id: backendReminder.id,
    title: backendReminder.title,
    description: backendReminder.description,
    dueDate: backendReminder.dueDate,
    priority: ensureValidPriority(backendReminder.priority) as "low" | "medium" | "high",
    location: backendReminder.location,
    completed: backendReminder.completed,
    completedAt: backendReminder.completedAt,
    createdAt: backendReminder.createdAt
  };
}

/**
 * Convert a UI reminder to a backend reminder
 */
export function convertToBackendReminder(uiReminder: UIReminder): BackendReminder {
  return {
    id: uiReminder.id,
    title: uiReminder.title,
    description: uiReminder.description,
    dueDate: uiReminder.dueDate,
    priority: ensureValidPriority(uiReminder.priority),
    location: uiReminder.location,
    completed: uiReminder.completed,
    completedAt: uiReminder.completedAt,
    createdAt: uiReminder.createdAt
  };
}
