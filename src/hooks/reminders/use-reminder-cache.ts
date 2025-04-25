
import { useCallback, useEffect, useRef } from "react";
import { Reminder } from "@/types/reminderTypes";
import { useToast } from "@/hooks/use-toast";

// Type for our cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number; // Track access frequency
  lastAccessed: number; // Track when item was last accessed
}

interface CacheState {
  reminders: Map<string, CacheItem<Reminder>>;
  reminderLists: Map<string, CacheItem<Reminder[]>>;
  version: string; // For schema versioning
}

// Cache expiration time (30 minutes instead of 15)
const CACHE_EXPIRATION = 30 * 60 * 1000;
// Extend TTL for frequently accessed items (additional 30 minutes)
const FREQUENT_ACCESS_THRESHOLD = 5;
const FREQUENT_ACCESS_EXTENSION = 30 * 60 * 1000;
// Cache version for schema migrations
const CACHE_VERSION = '1.0.0';

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
  const { toast } = useToast();
  // Use ref to ensure persistence between renders without causing re-renders
  const cacheRef = useRef<CacheState>({
    reminders: new Map(),
    reminderLists: new Map(),
    version: CACHE_VERSION,
  });

  // Stats for monitoring
  const statsRef = useRef({
    hits: 0,
    misses: 0,
    invalidations: 0,
    partial_updates: 0,
  });

  // Initialize cache from localStorage on mount
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('reminderCache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // Version check for schema migrations
        if (parsed.version !== CACHE_VERSION) {
          console.log(`Cache version mismatch (${parsed.version} vs ${CACHE_VERSION}), rebuilding cache`);
          // Clear cache and rebuild
          localStorage.removeItem('reminderCache');
          cacheRef.current = {
            reminders: new Map(),
            reminderLists: new Map(),
            version: CACHE_VERSION,
          };
          return;
        }
        
        // Rebuild Maps from serialized objects
        if (parsed.reminders) {
          const remindersMap = new Map();
          Object.entries(parsed.reminders).forEach(([key, value]: [string, any]) => {
            // Convert date strings back to Date objects
            if (value.data.dueDate) value.data.dueDate = new Date(value.data.dueDate);
            if (value.data.createdAt) value.data.createdAt = new Date(value.data.createdAt);
            if (value.data.completedAt) value.data.completedAt = new Date(value.data.completedAt);
            
            remindersMap.set(key, {
              ...value,
              accessCount: value.accessCount || 0,
              lastAccessed: value.lastAccessed || Date.now()
            });
          });
          cacheRef.current.reminders = remindersMap;
        }
        
        if (parsed.reminderLists) {
          const listsMap = new Map();
          Object.entries(parsed.reminderLists).forEach(([key, value]: [string, any]) => {
            // Convert date strings back to Date objects in lists
            if (Array.isArray(value.data)) {
              value.data = value.data.map((item: any) => {
                if (item.dueDate) item.dueDate = new Date(item.dueDate);
                if (item.createdAt) item.createdAt = new Date(item.createdAt);
                if (item.completedAt) item.completedAt = new Date(item.completedAt);
                return item;
              });
            }
            
            listsMap.set(key, {
              ...value,
              accessCount: value.accessCount || 0,
              lastAccessed: value.lastAccessed || Date.now()
            });
          });
          cacheRef.current.reminderLists = listsMap;
        }
        
        cacheRef.current.version = CACHE_VERSION;
        
        console.log("Loaded reminder cache from localStorage with version", CACHE_VERSION);
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
      // If there's an error loading the cache, initialize a fresh one
      cacheRef.current = {
        reminders: new Map(),
        reminderLists: new Map(),
        version: CACHE_VERSION,
      };
    }
  }, []);

  // Save cache to localStorage at regular intervals and when component unmounts
  useEffect(() => {
    // Save cache every 2 minutes
    const saveInterval = setInterval(() => {
      saveCache();
    }, 2 * 60 * 1000);
    
    // Cleanup function
    return () => {
      clearInterval(saveInterval);
      saveCache(); // Save one last time on unmount
    };
  }, []);

  // Function to save cache to localStorage
  const saveCache = useCallback(() => {
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
        reminderLists: serializedLists,
        version: CACHE_VERSION,
        stats: statsRef.current
      };
      
      localStorage.setItem('reminderCache', JSON.stringify(cacheData));
      console.log("Saved reminder cache to localStorage", {
        reminders: cacheRef.current.reminders.size,
        lists: cacheRef.current.reminderLists.size,
        stats: statsRef.current
      });
    } catch (error) {
      console.error("Error saving cache to localStorage:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Handle quota exceeded error
        pruneCache();
        toast({
          title: "Cache Storage Limit",
          description: "Some cached reminders were cleared to save space.",
          variant: "default",
          duration: 3000,
        });
      }
    }
  }, [toast]);

  // Prune cache when storage quota is exceeded
  const pruneCache = useCallback(() => {
    // Remove least recently accessed items first
    const remindersArray = Array.from(cacheRef.current.reminders.entries());
    const listsArray = Array.from(cacheRef.current.reminderLists.entries());
    
    // Sort by last accessed (oldest first)
    remindersArray.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    listsArray.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 20% of items
    const remindersToRemove = Math.max(1, Math.floor(remindersArray.length * 0.2));
    const listsToRemove = Math.max(1, Math.floor(listsArray.length * 0.2));
    
    for (let i = 0; i < remindersToRemove; i++) {
      if (remindersArray[i]) {
        cacheRef.current.reminders.delete(remindersArray[i][0]);
      }
    }
    
    for (let i = 0; i < listsToRemove; i++) {
      if (listsArray[i]) {
        cacheRef.current.reminderLists.delete(listsArray[i][0]);
      }
    }
    
    console.log(`Pruned ${remindersToRemove} reminders and ${listsToRemove} lists from cache`);
    
    // Try to save again
    try {
      saveCache();
    } catch (error) {
      console.error("Error saving cache after pruning:", error);
    }
  }, [saveCache]);

  // Check if cache is valid (not expired) with adaptive TTL
  const isValidCache = useCallback((item: CacheItem<any> | undefined): boolean => {
    if (!item) return false;
    
    const now = Date.now();
    let expirationTime = CACHE_EXPIRATION;
    
    // Extend TTL for frequently accessed items
    if (item.accessCount >= FREQUENT_ACCESS_THRESHOLD) {
      expirationTime += FREQUENT_ACCESS_EXTENSION;
    }
    
    return now - item.timestamp < expirationTime;
  }, []);

  // Update access metrics when an item is accessed
  const updateAccessMetrics = useCallback(<T>(item: CacheItem<T>): CacheItem<T> => {
    return {
      ...item,
      accessCount: item.accessCount + 1,
      lastAccessed: Date.now()
    };
  }, []);

  // Cache a single reminder
  const cacheReminder = useCallback((reminder: Reminder) => {
    cacheRef.current.reminders.set(reminder.id, {
      data: reminder,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    });
    
    // Also cache as detailed reminder
    cacheReminderDetail(reminder);
    
    // Update lists that might contain this reminder
    cacheRef.current.reminderLists.forEach((listItem, key) => {
      const list = listItem.data;
      const index = list.findIndex(r => r.id === reminder.id);
      
      if (index !== -1) {
        // Update the reminder in this list
        const updatedList = [...list];
        updatedList[index] = reminder;
        
        cacheRef.current.reminderLists.set(key, {
          ...listItem,
          data: updatedList,
          timestamp: Date.now() // Update timestamp for fresh data
        });
        
        statsRef.current.partial_updates++;
      }
    });
  }, []);

  // Get a cached reminder
  const getCachedReminder = useCallback((id: string): Reminder | null => {
    const cached = cacheRef.current.reminders.get(id);
    if (isValidCache(cached)) {
      statsRef.current.hits++;
      
      // Update access metrics
      if (cached) {
        cacheRef.current.reminders.set(id, updateAccessMetrics(cached));
      }
      
      return cached?.data || null;
    }
    
    statsRef.current.misses++;
    return null;
  }, [isValidCache, updateAccessMetrics]);

  // Cache a list of reminders with a given key (e.g., "user123-active")
  const cacheReminderList = useCallback((key: string, reminders: Reminder[]) => {
    cacheRef.current.reminderLists.set(key, {
      data: reminders,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
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
      statsRef.current.hits++;
      
      // Update access metrics
      if (cached) {
        cacheRef.current.reminderLists.set(key, updateAccessMetrics(cached));
      }
      
      return cached?.data || null;
    }
    
    statsRef.current.misses++;
    return null;
  }, [isValidCache, updateAccessMetrics]);

  // Invalidate a specific reminder in the cache
  const invalidateReminder = useCallback((id: string) => {
    cacheRef.current.reminders.delete(id);
    statsRef.current.invalidations++;
    
    // Also remove from localStorage
    try {
      localStorage.removeItem(`reminder-detail-${id}`);
      return true;
    } catch (err) {
      console.error(`Error removing reminder ${id} from localStorage:`, err);
      return false;
    }
  }, []);

  // Invalidate all cache for a specific user
  const invalidateUserCache = useCallback((userId: string) => {
    // Clear lists that belong to this user
    const keysToDelete: string[] = [];
    cacheRef.current.reminderLists.forEach((_, key) => {
      if (key.startsWith(userId)) {
        keysToDelete.push(key);
      }
    });
    
    // Delete keys in a separate loop to avoid modifying while iterating
    keysToDelete.forEach(key => {
      cacheRef.current.reminderLists.delete(key);
      statsRef.current.invalidations++;
    });
    
    return true;
  }, []);
  
  // Get cache stats for monitoring
  const getCacheStats = useCallback(() => {
    return {
      ...statsRef.current,
      reminderCount: cacheRef.current.reminders.size,
      listCount: cacheRef.current.reminderLists.size,
      hitRate: statsRef.current.hits / (statsRef.current.hits + statsRef.current.misses) || 0
    };
  }, []);

  // Perform a partial update on a list without replacing the whole list
  const updateReminderInLists = useCallback((reminder: Reminder) => {
    let updatedLists = 0;
    
    cacheRef.current.reminderLists.forEach((listItem, key) => {
      const list = listItem.data;
      const index = list.findIndex(r => r.id === reminder.id);
      
      if (index !== -1) {
        // Update the reminder in this list
        const updatedList = [...list];
        updatedList[index] = reminder;
        
        cacheRef.current.reminderLists.set(key, {
          ...listItem,
          data: updatedList,
          timestamp: Date.now() // Update timestamp for fresh data
        });
        
        updatedLists++;
      }
    });
    
    if (updatedLists > 0) {
      statsRef.current.partial_updates += updatedLists;
    }
    
    return updatedLists;
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
    getCacheStats,
    updateReminderInLists,
    pruneCache,
    saveCache
  };
}
