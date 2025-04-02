
import { useCallback, useEffect, useRef } from "react";
import { Reminder } from "@/types/reminderTypes";

// Type for our cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheState {
  reminders: Map<string, CacheItem<Reminder>>;
  reminderLists: Map<string, CacheItem<Reminder[]>>;
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Exported standalone functions for use outside of hook context
export function getDetailedReminder(id: string): Reminder | null {
  try {
    const cacheData = localStorage.getItem(`reminder-detail-${id}`);
    if (!cacheData) return null;
    
    const parsed = JSON.parse(cacheData);
    
    // Convert date strings back to Date objects
    if (parsed.dueDate) parsed.dueDate = new Date(parsed.dueDate);
    if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
    if (parsed.completedAt) parsed.completedAt = new Date(parsed.completedAt);
    
    return parsed as Reminder;
  } catch (err) {
    console.error(`Error retrieving detailed reminder ${id} from cache:`, err);
    return null;
  }
}

export function cacheReminderDetail(reminder: Reminder): void {
  try {
    localStorage.setItem(
      `reminder-detail-${reminder.id}`, 
      JSON.stringify(reminder)
    );
  } catch (err) {
    console.error(`Error caching detailed reminder ${reminder.id}:`, err);
  }
}

export function useReminderCache() {
  // Use ref to ensure persistence between renders without causing re-renders
  const cacheRef = useRef<CacheState>({
    reminders: new Map(),
    reminderLists: new Map(),
  });

  // Initialize cache from localStorage on mount
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('reminderCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // Rebuild Maps from serialized objects
        if (parsed.reminders) {
          const remindersMap = new Map();
          Object.entries(parsed.reminders).forEach(([key, value]: [string, any]) => {
            remindersMap.set(key, value);
          });
          cacheRef.current.reminders = remindersMap;
        }
        
        if (parsed.reminderLists) {
          const listsMap = new Map();
          Object.entries(parsed.reminderLists).forEach(([key, value]: [string, any]) => {
            listsMap.set(key, value);
          });
          cacheRef.current.reminderLists = listsMap;
        }
        
        console.log("Loaded reminder cache from localStorage");
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
      // If there's an error loading the cache, initialize a fresh one
      cacheRef.current = {
        reminders: new Map(),
        reminderLists: new Map(),
      };
    }
  }, []);

  // Save cache to localStorage when component unmounts
  useEffect(() => {
    return () => {
      try {
        // Serialize Maps to objects for storage
        const serializedReminders: Record<string, any> = {};
        cacheRef.current.reminders.forEach((value, key) => {
          serializedReminders[key] = value;
        });
        
        const serializedLists: Record<string, any> = {};
        cacheRef.current.reminderLists.forEach((value, key) => {
          serializedLists[key] = value;
        });
        
        const cacheData = {
          reminders: serializedReminders,
          reminderLists: serializedLists
        };
        
        localStorage.setItem('reminderCache', JSON.stringify(cacheData));
        console.log("Saved reminder cache to localStorage");
      } catch (error) {
        console.error("Error saving cache to localStorage:", error);
      }
    };
  }, []);

  // Check if cache is valid (not expired)
  const isValidCache = useCallback((item: CacheItem<any> | undefined): boolean => {
    if (!item) return false;
    return Date.now() - item.timestamp < CACHE_EXPIRATION;
  }, []);

  // Cache a single reminder
  const cacheReminder = useCallback((reminder: Reminder) => {
    cacheRef.current.reminders.set(reminder.id, {
      data: reminder,
      timestamp: Date.now(),
    });
    
    // Also cache as detailed reminder
    cacheReminderDetail(reminder);
  }, []);

  // Get a cached reminder
  const getCachedReminder = useCallback((id: string): Reminder | null => {
    const cached = cacheRef.current.reminders.get(id);
    if (isValidCache(cached)) {
      return cached.data;
    }
    return null;
  }, [isValidCache]);

  // Cache a list of reminders with a given key (e.g., "user123-active")
  const cacheReminderList = useCallback((key: string, reminders: Reminder[]) => {
    cacheRef.current.reminderLists.set(key, {
      data: reminders,
      timestamp: Date.now(),
    });
    
    // Also cache individual reminders
    reminders.forEach(reminder => {
      cacheReminder(reminder);
    });
  }, [cacheReminder]);

  // Get a cached reminder list
  const getCachedReminderList = useCallback((key: string): Reminder[] | null => {
    const cached = cacheRef.current.reminderLists.get(key);
    if (isValidCache(cached)) {
      return cached.data;
    }
    return null;
  }, [isValidCache]);

  // Invalidate a specific reminder in the cache
  const invalidateReminder = useCallback((id: string) => {
    cacheRef.current.reminders.delete(id);
    
    // Also remove from localStorage
    try {
      localStorage.removeItem(`reminder-detail-${id}`);
    } catch (err) {
      console.error(`Error removing reminder ${id} from localStorage:`, err);
    }
  }, []);

  // Invalidate all cache for a specific user
  const invalidateUserCache = useCallback((userId: string) => {
    // Clear lists that belong to this user
    cacheRef.current.reminderLists.forEach((_, key) => {
      if (key.startsWith(userId)) {
        cacheRef.current.reminderLists.delete(key);
      }
    });
  }, []);

  // Check if the cache is stale (older than a threshold)
  const isCacheStale = useCallback(() => {
    // Consider cache stale if it's older than 2 minutes
    const staleThreshold = 2 * 60 * 1000;
    const oldestAllowed = Date.now() - staleThreshold;
    
    // Check if any reminder list is stale
    let isStale = false;
    cacheRef.current.reminderLists.forEach((item) => {
      if (item.timestamp < oldestAllowed) {
        isStale = true;
      }
    });
    
    return isStale;
  }, []);

  // Get all cached reminders
  const getCachedReminders = useCallback(() => {
    // Convert the map to an array
    const reminders: Reminder[] = [];
    cacheRef.current.reminders.forEach((item) => {
      if (isValidCache(item)) {
        reminders.push(item.data);
      }
    });
    
    return {
      reminders,
      totalCount: reminders.length,
      timestamp: Date.now()
    };
  }, [isValidCache]);

  // Set cached reminders
  const setCachedReminders = useCallback((reminders: Reminder[], totalCount: number) => {
    // Add or update each reminder in the cache
    reminders.forEach(reminder => {
      cacheReminder(reminder);
    });
    
    // Also store as a list
    const userId = reminders.length > 0 ? reminders[0].userId : 'unknown';
    cacheReminderList(`${userId}-all`, reminders);
    
    // Store metadata
    try {
      localStorage.setItem('reminderCacheMetadata', JSON.stringify({
        totalCount,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error storing reminder cache metadata:', err);
    }
  }, [cacheReminder, cacheReminderList]);

  // Clear the entire reminder cache
  const clearReminderCache = useCallback(() => {
    cacheRef.current.reminders.clear();
    cacheRef.current.reminderLists.clear();
    
    try {
      // Clear from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reminder-') || key === 'reminderCache' || key === 'reminderCacheMetadata') {
          localStorage.removeItem(key);
        }
      });
      console.log("Reminder cache cleared");
    } catch (err) {
      console.error("Error clearing reminder cache:", err);
    }
  }, []);

  return {
    getCachedReminderList,
    cacheReminderList,
    cacheReminder,
    getCachedReminder,
    invalidateReminder,
    invalidateUserCache,
    getDetailedReminder,
    cacheReminderDetail,
    isCacheStale,
    getCachedReminders,
    setCachedReminders,
    clearReminderCache
  };
}
