
import { useCallback, useEffect, useRef } from "react";
import { Reminder } from "@/types/reminderTypes";
import { useCachePerformance } from "@/hooks/useCachePerformance";

// Type for our cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;  // Track how often this item is accessed
  lastAccessed: number; // When the item was last accessed
  priority: number;     // Priority level (0-10)
  size?: number;        // Estimated size in bytes
  source: 'api' | 'local' | 'service-worker'; // Where the data came from
}

interface CacheState {
  reminders: Map<string, CacheItem<Reminder>>;
  reminderLists: Map<string, CacheItem<Reminder[]>>;
  accessFrequency: Map<string, number>; // Track access frequency by key
  stats: {
    totalSize: number;    // Estimated total cache size
    itemCount: number;    // Total number of items
    oldestTimestamp: number; // Oldest item timestamp
  }
}

// Cache expiration times - more granular based on data type
const CACHE_EXPIRATION = {
  ACTIVE_REMINDERS: 5 * 60 * 1000,     // 5 minutes
  COMPLETED_REMINDERS: 30 * 60 * 1000, // 30 minutes
  DETAIL_VIEW: 10 * 60 * 1000,         // 10 minutes
  SYSTEM_DATA: 60 * 60 * 1000          // 1 hour
};

// Debug mode configuration
const DEBUG = process.env.NODE_ENV === 'development';

// Get cache expiration time based on key pattern
const getCacheExpirationForKey = (key: string): number => {
  if (key.includes('completed')) return CACHE_EXPIRATION.COMPLETED_REMINDERS;
  if (key.includes('detail')) return CACHE_EXPIRATION.DETAIL_VIEW;
  if (key.includes('system')) return CACHE_EXPIRATION.SYSTEM_DATA;
  return CACHE_EXPIRATION.ACTIVE_REMINDERS; // Default
};

// Estimate object size in bytes (simplified)
const estimateSize = (obj: any): number => {
  const jsonString = JSON.stringify(obj);
  return jsonString.length * 2; // Rough estimate: 2 bytes per character
};

// Exported standalone functions for use outside of hook context
export function getDetailedReminder(id: string): Reminder | null {
  try {
    const startTime = performance.now();
    const cacheData = localStorage.getItem(`reminder-detail-${id}`);
    
    if (!cacheData) {
      if (DEBUG) console.debug(`Cache miss: detailed reminder ${id}`);
      return null;
    }
    
    const parsed = JSON.parse(cacheData);
    
    // Check expiration
    if (Date.now() - parsed._timestamp > CACHE_EXPIRATION.DETAIL_VIEW) {
      if (DEBUG) console.debug(`Cache expired: detailed reminder ${id}`);
      localStorage.removeItem(`reminder-detail-${id}`);
      return null;
    }
    
    // Convert date strings back to Date objects
    if (parsed.dueDate) parsed.dueDate = new Date(parsed.dueDate);
    if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
    if (parsed.completedAt) parsed.completedAt = new Date(parsed.completedAt);
    
    if (DEBUG) {
      const endTime = performance.now();
      console.debug(`Cache hit: detailed reminder ${id} (${(endTime - startTime).toFixed(2)}ms)`);
    }
    
    return parsed as Reminder;
  } catch (err) {
    console.error(`Error retrieving detailed reminder ${id} from cache:`, err);
    return null;
  }
}

export function cacheReminderDetail(reminder: Reminder): void {
  try {
    // Add timestamp for expiration check
    const dataToCache = {
      ...reminder,
      _timestamp: Date.now(),
      _accessCount: 1
    };
    
    localStorage.setItem(
      `reminder-detail-${reminder.id}`, 
      JSON.stringify(dataToCache)
    );
    
    if (DEBUG) {
      console.debug(`Cached detailed reminder ${reminder.id}`);
    }
  } catch (err) {
    console.error(`Error caching detailed reminder ${reminder.id}:`, err);
  }
}

export function useReminderCache() {
  // Use performance monitoring hook
  const { 
    recordHit, 
    recordMiss, 
    metrics, 
    updateMetrics,
    logMetrics
  } = useCachePerformance({
    enabled: true,
    logToConsole: DEBUG,
    logFrequency: 60000,  // Log every minute in debug mode
    sampleRate: DEBUG ? 1.0 : 0.1  // Monitor all operations in debug, 10% in prod
  });
  
  // Use ref to ensure persistence between renders without causing re-renders
  const cacheRef = useRef<CacheState>({
    reminders: new Map(),
    reminderLists: new Map(),
    accessFrequency: new Map(),
    stats: {
      totalSize: 0,
      itemCount: 0,
      oldestTimestamp: Date.now()
    }
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
            // Add missing properties for backward compatibility
            const enhancedValue = {
              ...value,
              accessCount: value.accessCount || 1,
              lastAccessed: value.lastAccessed || Date.now(),
              priority: value.priority || 5,
              size: value.size || estimateSize(value.data),
              source: value.source || 'local'
            };
            remindersMap.set(key, enhancedValue);
          });
          cacheRef.current.reminders = remindersMap;
        }
        
        if (parsed.reminderLists) {
          const listsMap = new Map();
          Object.entries(parsed.reminderLists).forEach(([key, value]: [string, any]) => {
            // Add missing properties for backward compatibility
            const enhancedValue = {
              ...value,
              accessCount: value.accessCount || 1,
              lastAccessed: value.lastAccessed || Date.now(),
              priority: value.priority || 5,
              size: value.size || estimateSize(value.data),
              source: value.source || 'local'
            };
            listsMap.set(key, enhancedValue);
          });
          cacheRef.current.reminderLists = listsMap;
        }
        
        // Rebuild access frequency map
        if (parsed.accessFrequency) {
          const frequencyMap = new Map();
          Object.entries(parsed.accessFrequency).forEach(([key, value]: [string, any]) => {
            frequencyMap.set(key, value);
          });
          cacheRef.current.accessFrequency = frequencyMap;
        }
        
        // Stats
        if (parsed.stats) {
          cacheRef.current.stats = parsed.stats;
        }
        
        if (DEBUG) console.debug("Loaded reminder cache from localStorage:", {
          reminders: cacheRef.current.reminders.size,
          lists: cacheRef.current.reminderLists.size,
          totalSize: `${(cacheRef.current.stats.totalSize / 1024).toFixed(2)}KB`
        });
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error);
      // If there's an error loading the cache, initialize a fresh one
      cacheRef.current = {
        reminders: new Map(),
        reminderLists: new Map(),
        accessFrequency: new Map(),
        stats: {
          totalSize: 0,
          itemCount: 0,
          oldestTimestamp: Date.now()
        }
      };
    }
    
    // Set up periodic cache maintenance
    const maintenanceInterval = setInterval(() => {
      performCacheMaintenance();
    }, 60000); // Run every minute
    
    return () => {
      clearInterval(maintenanceInterval);
      // Save cache on unmount
      saveCache();
    };
  }, []);

  // Save cache to localStorage
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
      
      const serializedFrequency: Record<string, any> = {};
      cacheRef.current.accessFrequency.forEach((value, key) => {
        serializedFrequency[key] = value;
      });
      
      const cacheData = {
        reminders: serializedReminders,
        reminderLists: serializedLists,
        accessFrequency: serializedFrequency,
        stats: cacheRef.current.stats,
        _lastSaved: Date.now()
      };
      
      localStorage.setItem('reminderCache', JSON.stringify(cacheData));
      
      if (DEBUG) {
        console.debug("Saved reminder cache to localStorage", {
          reminders: cacheRef.current.reminders.size,
          lists: cacheRef.current.reminderLists.size,
          totalSize: `${(cacheRef.current.stats.totalSize / 1024).toFixed(2)}KB`
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error saving cache to localStorage:", error);
      return false;
    }
  }, []);

  // Perform cache maintenance: remove expired items, update stats
  const performCacheMaintenance = useCallback(() => {
    try {
      const now = Date.now();
      let removedItems = 0;
      let freedBytes = 0;
      
      // Clean up reminders cache
      cacheRef.current.reminders.forEach((item, key) => {
        const expiration = getCacheExpirationForKey(key);
        // Remove if expired or not accessed in a long time and low priority
        if (now - item.timestamp > expiration || 
            (now - item.lastAccessed > expiration * 2 && item.priority < 3)) {
          const size = item.size || 0;
          cacheRef.current.reminders.delete(key);
          cacheRef.current.stats.totalSize -= size;
          cacheRef.current.stats.itemCount--;
          freedBytes += size;
          removedItems++;
        }
      });
      
      // Clean up reminder lists cache
      cacheRef.current.reminderLists.forEach((item, key) => {
        const expiration = getCacheExpirationForKey(key);
        // Remove if expired or not accessed in a long time and low priority
        if (now - item.timestamp > expiration || 
            (now - item.lastAccessed > expiration * 2 && item.priority < 3)) {
          const size = item.size || 0;
          cacheRef.current.reminderLists.delete(key);
          cacheRef.current.stats.totalSize -= size;
          cacheRef.current.stats.itemCount--;
          freedBytes += size;
          removedItems++;
        }
      });
      
      // Update oldest timestamp if needed
      let oldestTimestamp = now;
      cacheRef.current.reminders.forEach(item => {
        if (item.timestamp < oldestTimestamp) oldestTimestamp = item.timestamp;
      });
      cacheRef.current.reminderLists.forEach(item => {
        if (item.timestamp < oldestTimestamp) oldestTimestamp = item.timestamp;
      });
      cacheRef.current.stats.oldestTimestamp = oldestTimestamp;
      
      if (DEBUG && removedItems > 0) {
        console.debug(`Cache maintenance: removed ${removedItems} items, freed ${(freedBytes / 1024).toFixed(2)}KB`);
      }
      
      // Update memory usage metrics
      updateMetrics();
      
      return { removedItems, freedBytes };
    } catch (err) {
      console.error("Error during cache maintenance:", err);
      return { removedItems: 0, freedBytes: 0 };
    }
  }, [updateMetrics]);

  // Track access frequency for key
  const trackAccess = useCallback((key: string) => {
    const currentCount = cacheRef.current.accessFrequency.get(key) || 0;
    cacheRef.current.accessFrequency.set(key, currentCount + 1);
  }, []);

  // Calculate priority for a cache item
  const calculatePriority = useCallback((key: string, isUpdate: boolean = false): number => {
    const baseScore = 5; // Default middle priority
    const frequencyBonus = Math.min(3, Math.log2((cacheRef.current.accessFrequency.get(key) || 0) + 1));
    
    // Higher priority for urgent/important items
    const importanceBonus = key.includes('urgent') ? 2 : 
                            key.includes('today') ? 1 : 0;
                            
    // Lower priority for completed items
    const completedPenalty = key.includes('completed') ? -2 : 0;
    
    // Modifier for user's current view context could be added here
    // (would require additional context from the application)
    
    // Update gets slight priority boost
    const updateBonus = isUpdate ? 1 : 0;
    
    const finalPriority = Math.min(10, Math.max(1, 
      baseScore + frequencyBonus + importanceBonus + completedPenalty + updateBonus
    ));
    
    return finalPriority;
  }, []);

  // Check if cache is valid (not expired)
  const isValidCache = useCallback((item: CacheItem<any> | undefined, key: string): boolean => {
    if (!item) return false;
    
    const expiration = getCacheExpirationForKey(key);
    const isValid = Date.now() - item.timestamp < expiration;
    
    if (!isValid && DEBUG) {
      console.debug(`Cache expired for ${key}, age: ${(Date.now() - item.timestamp) / 1000}s, limit: ${expiration / 1000}s`);
    }
    
    return isValid;
  }, []);

  // Cache a single reminder with enhanced metadata
  const cacheReminder = useCallback((reminder: Reminder, source: 'api' | 'local' | 'service-worker' = 'api') => {
    const startTime = performance.now();
    const key = reminder.id;
    const dataSize = estimateSize(reminder);
    
    // Track access for future priority calculation
    trackAccess(`reminder-${key}`);
    
    // Update or create cache entry
    const priority = calculatePriority(`reminder-${key}`, true);
    const cacheItem: CacheItem<Reminder> = {
      data: reminder,
      timestamp: Date.now(),
      accessCount: (cacheRef.current.reminders.get(key)?.accessCount || 0) + 1,
      lastAccessed: Date.now(),
      priority,
      size: dataSize,
      source
    };
    
    // Update stats
    if (!cacheRef.current.reminders.has(key)) {
      cacheRef.current.stats.itemCount++;
      cacheRef.current.stats.totalSize += dataSize;
    } else {
      const oldSize = cacheRef.current.reminders.get(key)?.size || 0;
      cacheRef.current.stats.totalSize = cacheRef.current.stats.totalSize - oldSize + dataSize;
    }
    
    cacheRef.current.reminders.set(key, cacheItem);
    
    // Also cache as detailed reminder
    cacheReminderDetail(reminder);
    
    const endTime = performance.now();
    if (DEBUG) console.debug(`Cached reminder ${key} (${(endTime - startTime).toFixed(2)}ms), priority: ${priority}`);
    
    return true;
  }, [trackAccess, calculatePriority]);

  // Get a cached reminder with performance tracking
  const getCachedReminder = useCallback((id: string): Reminder | null => {
    const startTime = performance.now();
    const key = id;
    const cached = cacheRef.current.reminders.get(key);
    
    if (isValidCache(cached, `reminder-${key}`)) {
      // Update access metadata
      if (cached) {
        cached.accessCount += 1;
        cached.lastAccessed = Date.now();
        cacheRef.current.reminders.set(key, cached);
      }
      
      // Track for priority calculation
      trackAccess(`reminder-${key}`);
      
      const endTime = performance.now();
      recordHit(endTime - startTime, cacheRef.current.stats.totalSize);
      
      if (DEBUG) console.debug(`Cache hit: reminder ${key} (${(endTime - startTime).toFixed(2)}ms)`);
      
      return cached?.data || null;
    }
    
    const endTime = performance.now();
    recordMiss(endTime - startTime, cacheRef.current.stats.totalSize);
    
    if (DEBUG) console.debug(`Cache miss: reminder ${key} (${(endTime - startTime).toFixed(2)}ms)`);
    
    return null;
  }, [isValidCache, trackAccess, recordHit, recordMiss]);

  // Cache a list of reminders with a given key
  const cacheReminderList = useCallback((key: string, reminders: Reminder[], source: 'api' | 'local' | 'service-worker' = 'api') => {
    const startTime = performance.now();
    const dataSize = estimateSize(reminders);
    
    // Track access for future priority calculation
    trackAccess(`list-${key}`);
    
    // Calculate priority based on key and access patterns
    const priority = calculatePriority(`list-${key}`, true);
    
    const cacheItem: CacheItem<Reminder[]> = {
      data: reminders,
      timestamp: Date.now(),
      accessCount: (cacheRef.current.reminderLists.get(key)?.accessCount || 0) + 1,
      lastAccessed: Date.now(),
      priority,
      size: dataSize,
      source
    };
    
    // Update stats
    if (!cacheRef.current.reminderLists.has(key)) {
      cacheRef.current.stats.itemCount++;
      cacheRef.current.stats.totalSize += dataSize;
    } else {
      const oldSize = cacheRef.current.reminderLists.get(key)?.size || 0;
      cacheRef.current.stats.totalSize = cacheRef.current.stats.totalSize - oldSize + dataSize;
    }
    
    cacheRef.current.reminderLists.set(key, cacheItem);
    
    // Also cache individual reminders
    reminders.forEach(reminder => {
      cacheReminder(reminder, source);
    });
    
    const endTime = performance.now();
    if (DEBUG) {
      console.debug(`Cached reminder list ${key} with ${reminders.length} items (${(endTime - startTime).toFixed(2)}ms), priority: ${priority}`);
    }
    
    return true;
  }, [cacheReminder, trackAccess, calculatePriority]);

  // Get a cached reminder list with performance tracking
  const getCachedReminderList = useCallback((key: string): Reminder[] | null => {
    const startTime = performance.now();
    const cached = cacheRef.current.reminderLists.get(key);
    
    if (isValidCache(cached, `list-${key}`)) {
      // Update access metadata
      if (cached) {
        cached.accessCount += 1;
        cached.lastAccessed = Date.now();
        cacheRef.current.reminderLists.set(key, cached);
      }
      
      // Track for priority calculation
      trackAccess(`list-${key}`);
      
      const endTime = performance.now();
      recordHit(endTime - startTime, cacheRef.current.stats.totalSize);
      
      if (DEBUG) console.debug(`Cache hit: reminder list ${key} (${(endTime - startTime).toFixed(2)}ms)`);
      
      return cached?.data || null;
    }
    
    const endTime = performance.now();
    recordMiss(endTime - startTime, cacheRef.current.stats.totalSize);
    
    if (DEBUG) console.debug(`Cache miss: reminder list ${key} (${(endTime - startTime).toFixed(2)}ms)`);
    
    return null;
  }, [isValidCache, trackAccess, recordHit, recordMiss]);

  // Invalidate a specific reminder in the cache
  const invalidateReminder = useCallback((id: string) => {
    const startTime = performance.now();
    
    // Remove from in-memory cache
    const size = cacheRef.current.reminders.get(id)?.size || 0;
    const hadItem = cacheRef.current.reminders.delete(id);
    
    if (hadItem) {
      cacheRef.current.stats.itemCount--;
      cacheRef.current.stats.totalSize -= size;
    }
    
    // Also remove from localStorage
    try {
      localStorage.removeItem(`reminder-detail-${id}`);
      const endTime = performance.now();
      
      if (DEBUG) console.debug(`Invalidated reminder ${id} (${(endTime - startTime).toFixed(2)}ms)`);
      
      return true;
    } catch (err) {
      console.error(`Error removing reminder ${id} from localStorage:`, err);
      return false;
    }
  }, []);

  // Invalidate all cache for a specific user
  const invalidateUserCache = useCallback((userId: string) => {
    const startTime = performance.now();
    let keysDeleted = 0;
    let bytesFreed = 0;
    
    // Clear lists that belong to this user
    const keysToDelete: string[] = [];
    cacheRef.current.reminderLists.forEach((value, key) => {
      if (key.startsWith(userId)) {
        keysToDelete.push(key);
        bytesFreed += value.size || 0;
        keysDeleted++;
      }
    });
    
    // Delete keys in a separate loop to avoid modifying while iterating
    keysToDelete.forEach(key => {
      cacheRef.current.reminderLists.delete(key);
    });
    
    // Update user-related items in localStorage too
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(userId)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.error(`Error clearing localStorage for user ${userId}:`, err);
    }
    
    // Update stats
    cacheRef.current.stats.itemCount -= keysDeleted;
    cacheRef.current.stats.totalSize -= bytesFreed;
    
    const endTime = performance.now();
    if (DEBUG) {
      console.debug(`Invalidated cache for user ${userId}: ${keysDeleted} items, ${(bytesFreed / 1024).toFixed(2)}KB freed (${(endTime - startTime).toFixed(2)}ms)`);
    }
    
    return { keysDeleted, bytesFreed };
  }, []);

  // Prefetch/warm the cache with predictable data
  const warmCache = useCallback(async (userId: string, predictionType: 'today' | 'upcoming' | 'frequent' = 'today') => {
    if (!window.navigator.onLine) {
      if (DEBUG) console.debug('Skipping cache warming - offline');
      return false;
    }
    
    try {
      // This would typically make API calls to prefetch data
      // For now, just log the intent in debug mode
      if (DEBUG) console.debug(`Would warm cache for user ${userId} with ${predictionType} data`);
      
      // In a real implementation, this would fetch data from an API
      // and then cache it using cacheReminderList
      
      return true;
    } catch (err) {
      console.error('Error warming cache:', err);
      return false;
    }
  }, []);

  // Execute service worker cache operations if available
  const syncWithServiceWorker = useCallback(() => {
    // Skip if no service worker
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return Promise.resolve(false);
    }
    
    return new Promise<boolean>(resolve => {
      // Create message channel for response
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        if (event.data && event.data.type === 'CACHE_STATS') {
          if (DEBUG) console.debug('Service worker cache stats:', event.data.payload?.stats);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      // Send message to service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'GET_CACHE_STATS'
      }, [messageChannel.port2]);
      
      // Resolve after timeout
      setTimeout(() => resolve(false), 1000);
    });
  }, []);

  // Get overall cache statistics
  const getCacheStats = useCallback(() => {
    return {
      memoryCache: {
        reminders: cacheRef.current.reminders.size,
        reminderLists: cacheRef.current.reminderLists.size,
        totalSize: cacheRef.current.stats.totalSize,
        itemCount: cacheRef.current.stats.itemCount,
        oldestItem: new Date(cacheRef.current.stats.oldestTimestamp)
      },
      performance: metrics
    };
  }, [metrics]);

  // Save cache before window unloads
  useEffect(() => {
    const handleUnload = () => saveCache();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveCache]);

  return {
    // Basic cache operations
    getCachedReminderList,
    cacheReminderList,
    cacheReminder,
    getCachedReminder,
    invalidateReminder,
    invalidateUserCache,
    getDetailedReminder,
    cacheReminderDetail,
    
    // Enhanced functionality
    warmCache,
    performCacheMaintenance,
    getCacheStats,
    saveCache,
    syncWithServiceWorker,
    
    // Performance metrics
    cacheMetrics: metrics,
    logCacheMetrics: logMetrics
  };
}
