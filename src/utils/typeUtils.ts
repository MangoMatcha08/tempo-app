
import { Reminder as UIReminder } from "@/types/reminder";
import { Reminder as BackendReminder, ReminderPriority } from "@/types/reminderTypes";
import { useMemo } from "react";

/**
 * Converts a backend reminder to a UI reminder with improved performance
 * This is optimized for frequent conversions
 */
export const convertToUIReminder = (reminder: BackendReminder): UIReminder => {
  // Quick validation to ensure we don't process invalid data
  if (!reminder || typeof reminder !== 'object') {
    console.warn('Invalid reminder object provided to convertToUIReminder');
    return {} as UIReminder;
  }

  return {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate,
    priority: reminder.priority as "low" | "medium" | "high",
    location: reminder.location,
    completed: reminder.completed,
    completedAt: reminder.completedAt,
    createdAt: reminder.createdAt
  };
};

/**
 * Cache for UI reminder to backend reminder conversion
 * This prevents expensive re-conversion of the same objects
 */
const conversionCache = new WeakMap<UIReminder, BackendReminder>();

/**
 * Converts a UI reminder to a backend reminder with caching
 * Uses WeakMap for memory-efficient caching without memory leaks
 */
export const convertToBackendReminder = (reminder: UIReminder): BackendReminder => {
  // Check if we already converted this object
  const cached = conversionCache.get(reminder);
  if (cached) {
    return cached;
  }

  // Ensure priority is a valid ReminderPriority enum value
  let priority = reminder.priority;
  if (!Object.values(ReminderPriority).includes(priority as ReminderPriority)) {
    console.warn(`Invalid priority value: ${priority}, defaulting to medium`);
    priority = ReminderPriority.MEDIUM;
  }

  const result: BackendReminder = {
    id: reminder.id,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate,
    priority: priority as ReminderPriority,
    location: reminder.location,
    completed: reminder.completed,
    completedAt: reminder.completedAt,
    createdAt: reminder.createdAt
  };

  // Cache the result
  conversionCache.set(reminder, result);
  
  return result;
};

/**
 * Function to ensure a reminder has a valid priority
 * This is memoized for consistent returns of the same values
 */
export const ensureValidPriority = (priority: any): "low" | "medium" | "high" => {
  const validPriorities = ["low", "medium", "high"];
  if (validPriorities.includes(priority)) {
    return priority as "low" | "medium" | "high";
  }
  return "medium";
};

/**
 * Utility function to create a memoized formatter for timestamps
 * This prevents recreation of the same formatted strings
 */
export const createTimeFormatter = () => {
  const cache = new Map<number, string>();
  
  return (date: Date, format: 'time' | 'relative' | 'full' = 'time'): string => {
    if (!date || !(date instanceof Date)) {
      return '';
    }
    
    // Create a cache key combining the timestamp and format
    const cacheKey = date.getTime() + (format === 'time' ? 0 : format === 'relative' ? 1 : 2);
    
    // Check if we already formatted this time
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as string;
    }
    
    let result = '';
    
    // Format based on requested style
    if (format === 'time') {
      result = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (format === 'relative') {
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 0) result = "Overdue";
      else if (diffMins < 60) result = `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
      else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) result = `${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
        else {
          const diffDays = Math.floor(diffHours / 24);
          result = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        }
      }
    } else {
      result = date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Cache the result (limit cache size to prevent memory issues)
    if (cache.size > 1000) {
      // Clear oldest entries if cache gets too large
      const keys = Array.from(cache.keys());
      for (let i = 0; i < 200; i++) {
        cache.delete(keys[i]);
      }
    }
    
    cache.set(cacheKey, result);
    return result;
  };
};

// Create singleton instances of the formatters for app-wide use
export const formatTime = createTimeFormatter();
