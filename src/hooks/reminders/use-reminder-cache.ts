
import { useState, useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';

// Constants
const REMINDER_CACHE_PREFIX = 'reminderCache-';
const REMINDER_CACHE_EXPIRATION = 15 * 60 * 1000; // 15 minutes
const REMINDER_DETAIL_CACHE_PREFIX = 'reminderDetail-';
const REMINDER_DETAIL_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

interface CacheMetadata {
  timestamp: number;
  userId: string;
}

export function useReminderCache() {
  // Helper to store reminders by key
  const cacheReminderList = useCallback((key: string, reminders: Reminder[]) => {
    try {
      const cacheData = {
        reminders,
        metadata: {
          timestamp: Date.now(),
          userId: key.split('-')[0] // Extract userId from the key
        }
      };
      
      localStorage.setItem(REMINDER_CACHE_PREFIX + key, JSON.stringify(cacheData));
      console.log(`Cached ${reminders.length} reminders with key ${key}`);
    } catch (error) {
      console.error('Error caching reminders:', error);
    }
  }, []);

  // Helper to retrieve reminders by key
  const getCachedReminderList = useCallback((key: string): Reminder[] | null => {
    try {
      const cacheJson = localStorage.getItem(REMINDER_CACHE_PREFIX + key);
      
      if (!cacheJson) {
        return null;
      }
      
      const cacheData = JSON.parse(cacheJson);
      const metadata = cacheData.metadata as CacheMetadata;
      
      // Check if cache is stale
      if (Date.now() - metadata.timestamp > REMINDER_CACHE_EXPIRATION) {
        console.log('Cache is stale for key:', key);
        return null;
      }
      
      return cacheData.reminders as Reminder[];
    } catch (error) {
      console.error('Error retrieving cached reminders:', error);
      return null;
    }
  }, []);

  // Helper to store a single reminder (for detail view)
  const cacheReminder = useCallback((reminder: Reminder) => {
    if (!reminder?.id) return;
    
    try {
      const cacheData = {
        reminder,
        metadata: {
          timestamp: Date.now(),
          userId: reminder.userId
        }
      };
      
      localStorage.setItem(REMINDER_DETAIL_CACHE_PREFIX + reminder.id, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching reminder detail:', error);
    }
  }, []);

  // Helper to retrieve a single reminder
  const getDetailedReminder = useCallback((id: string): Reminder | null => {
    try {
      const cacheJson = localStorage.getItem(REMINDER_DETAIL_CACHE_PREFIX + id);
      
      if (!cacheJson) {
        return null;
      }
      
      const cacheData = JSON.parse(cacheJson);
      const metadata = cacheData.metadata as CacheMetadata;
      
      // Check if cache is stale
      if (Date.now() - metadata.timestamp > REMINDER_DETAIL_CACHE_EXPIRATION) {
        console.log('Reminder detail cache is stale for id:', id);
        return null;
      }
      
      return cacheData.reminder as Reminder;
    } catch (error) {
      console.error('Error retrieving cached reminder detail:', error);
      return null;
    }
  }, []);

  // Clear all caches for a user
  const invalidateUserCache = useCallback((userId: string) => {
    try {
      const keysToRemove: string[] = [];
      
      // Find all cache keys related to this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          (key.startsWith(REMINDER_CACHE_PREFIX) && key.includes(userId)) ||
          (key.startsWith(REMINDER_DETAIL_CACHE_PREFIX))
        )) {
          // For detail caches, check if they belong to this user
          if (key.startsWith(REMINDER_DETAIL_CACHE_PREFIX)) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              if (data.metadata?.userId === userId) {
                keysToRemove.push(key);
              }
            } catch (e) {
              // If we can't parse it, remove it to be safe
              keysToRemove.push(key);
            }
          } else {
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove all found keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Invalidated ${keysToRemove.length} cache entries for user ${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error invalidating user cache:', error);
      return false;
    }
  }, []);

  // Invalidate a specific reminder
  const invalidateReminder = useCallback((id: string) => {
    try {
      localStorage.removeItem(REMINDER_DETAIL_CACHE_PREFIX + id);
      return true;
    } catch (error) {
      console.error('Error invalidating reminder cache:', error);
      return false;
    }
  }, []);

  // Check if a user's cache is stale
  const isUserCacheStale = useCallback((userId: string): boolean => {
    try {
      // Look for any cache key for this user
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(REMINDER_CACHE_PREFIX) && key.includes(userId)) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.metadata && data.metadata.timestamp) {
              // If cache is not too old, it's not stale
              if (Date.now() - data.metadata.timestamp < REMINDER_CACHE_EXPIRATION) {
                return false;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      // If we didn't find a fresh cache, it's stale
      return true;
    } catch (error) {
      console.error('Error checking if user cache is stale:', error);
      return true; // Assume stale if there's an error
    }
  }, []);

  return {
    cacheReminderList,
    getCachedReminderList,
    cacheReminder,
    getDetailedReminder,
    invalidateUserCache,
    invalidateReminder,
    isUserCacheStale
  };
}
