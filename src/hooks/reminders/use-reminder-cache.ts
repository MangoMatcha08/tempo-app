
import { useCallback } from 'react';
import { Reminder } from '@/types/reminderTypes';

// Cache constants
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const REMINDER_CACHE_PREFIX = 'reminderCache_';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const useReminderCache = () => {
  // Get cached reminders for a user
  const getCachedReminderList = useCallback((key: string): Reminder[] => {
    try {
      const cacheKey = `${REMINDER_CACHE_PREFIX}${key}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return [];
      
      const cacheEntry: CacheEntry<Reminder[]> = JSON.parse(cached);
      return cacheEntry.data;
    } catch (error) {
      console.error('Error reading from reminder cache:', error);
      return [];
    }
  }, []);

  // Store reminders in cache
  const cacheReminderList = useCallback((key: string, reminders: Reminder[]): void => {
    try {
      const cacheKey = `${REMINDER_CACHE_PREFIX}${key}`;
      const cacheEntry: CacheEntry<Reminder[]> = {
        data: reminders,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error writing to reminder cache:', error);
    }
  }, []);

  // Cache a single reminder
  const cacheReminder = useCallback((reminder: Reminder): void => {
    try {
      const cacheKey = `${REMINDER_CACHE_PREFIX}detail_${reminder.id}`;
      const cacheEntry: CacheEntry<Reminder> = {
        data: reminder,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error caching reminder:', error);
    }
  }, []);
  
  // Get a single cached reminder
  const getDetailedReminder = useCallback((id: string): Reminder | null => {
    try {
      const cacheKey = `${REMINDER_CACHE_PREFIX}detail_${id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheEntry: CacheEntry<Reminder> = JSON.parse(cached);
      return cacheEntry.data;
    } catch (error) {
      console.error('Error getting cached reminder:', error);
      return null;
    }
  }, []);
  
  // Cache detailed reminder
  const cacheReminderDetail = useCallback((reminder: Reminder): void => {
    cacheReminder(reminder);
  }, [cacheReminder]);
  
  // Check if cache is stale
  const isUserCacheStale = useCallback((userId: string): boolean => {
    try {
      const cacheKey = `${REMINDER_CACHE_PREFIX}${userId}-reminders`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return true;
      
      const cacheEntry: CacheEntry<any> = JSON.parse(cached);
      const now = Date.now();
      
      return (now - cacheEntry.timestamp) > CACHE_EXPIRY_MS;
    } catch (error) {
      console.error('Error checking cache staleness:', error);
      return true;
    }
  }, []);
  
  // Invalidate cache for a user
  const invalidateUserCache = useCallback((userId: string): void => {
    try {
      const cacheKey = `${REMINDER_CACHE_PREFIX}${userId}-reminders`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
  }, []);

  return {
    getCachedReminderList,
    cacheReminderList,
    cacheReminder,
    getDetailedReminder,
    cacheReminderDetail,
    isUserCacheStale,
    invalidateUserCache
  };
};
