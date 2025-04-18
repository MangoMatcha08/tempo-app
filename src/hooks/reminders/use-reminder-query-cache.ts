
import { useState, useCallback } from 'react';
import { DatabaseReminder } from "@/types/reminderTypes";

// Cache settings
const CACHE_KEY = 'reminderCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const CACHE_USER_KEY = 'reminderCacheUser';

export function useReminderQueryCache(user: any) {
  // Function to check cache validity
  const isCacheValid = useCallback(() => {
    try {
      const cacheString = localStorage.getItem(CACHE_KEY);
      if (!cacheString) return false;
      
      const cache = JSON.parse(cacheString);
      const cacheUser = localStorage.getItem(CACHE_USER_KEY);
      
      if (!cacheUser || cacheUser !== user?.uid) return false;
      
      const now = Date.now();
      if (!cache.timestamp || now - cache.timestamp > CACHE_EXPIRY) return false;
      
      return true;
    } catch (e) {
      console.error("Error checking cache validity:", e);
      return false;
    }
  }, [user?.uid]);

  // Function to get from cache
  const getFromCache = useCallback(() => {
    try {
      const cacheString = localStorage.getItem(CACHE_KEY);
      if (!cacheString) return null;
      
      const cache = JSON.parse(cacheString);
      return cache.data;
    } catch (e) {
      console.error("Error retrieving from cache:", e);
      return null;
    }
  }, []);

  // Function to save to cache
  const saveToCache = useCallback((data: DatabaseReminder[]) => {
    try {
      const cache = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      localStorage.setItem(CACHE_USER_KEY, user?.uid || '');
    } catch (e) {
      console.error("Error saving to cache:", e);
    }
  }, [user?.uid]);

  return {
    isCacheValid,
    getFromCache,
    saveToCache
  };
}
