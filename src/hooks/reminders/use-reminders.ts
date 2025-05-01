
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, query, where, orderBy, limit, startAfter, getDocs, getCountFromServer } from "firebase/firestore";
import { useFirestore } from "@/contexts/FirestoreContext";
import { useAuth } from "@/contexts/AuthContext";
import { ReminderPriority, ReminderCategory, UIReminder, DatabaseReminder, Reminder } from "@/types/reminderTypes";
import { useReminderCache } from "./use-reminder-cache";
import { convertTimestampFields } from "@/lib/firebase/conversions";
import { useReminderOperations } from "./reminder-operations";
import { isHighPriority, isMediumPriority, isLowPriority } from "@/utils/typeUtils";

// Batch size for query pagination
const BATCH_SIZE = 20; // Increased from 10 to 20

// Keys for storing reminders in localStorage
const ACTIVE_REMINDERS_KEY = "active-reminders";
const COMPLETED_REMINDERS_KEY = "completed-reminders";

export function useReminders() {
  // Auth and Firestore
  const { user } = useAuth();
  const { db, isReady } = useFirestore();
  
  // Local state
  const [reminders, setReminders] = useState<UIReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingStartTime, setLoadingStartTime] = useState(0);
  
  // Optimistic UI and operations
  const {
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    deleteReminder,
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders,
    isReminderPending,
    pendingReminders,
    saveCache
  } = useReminderOperations(user, db, isReady);

  // Reminder cache
  const { 
    getCachedReminderList, 
    cacheReminderList,
    getCacheStats
  } = useReminderCache();
  
  // Grouped reminders by type
  const urgentReminders = useMemo(() => {
    return reminders.filter(reminder => 
      !reminder.completed && 
      isHighPriority(reminder.priority)
    );
  }, [reminders]);
  
  const upcomingReminders = useMemo(() => {
    return reminders.filter(reminder => 
      !reminder.completed && 
      !isHighPriority(reminder.priority)
    ).sort((a, b) => {
      // Sort by date/time
      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [reminders]);
  
  const completedReminders = useMemo(() => {
    return reminders
      .filter(reminder => reminder.completed)
      .sort((a, b) => {
        const dateA = a.completedAt instanceof Date ? a.completedAt : a.completedAt ? new Date(a.completedAt) : new Date();
        const dateB = b.completedAt instanceof Date ? b.completedAt : b.completedAt ? new Date(b.completedAt) : new Date();
        return dateB.getTime() - dateA.getTime();
      });
  }, [reminders]);
  
  // Stats for dashboard
  const reminderStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Due dates are at the start of the day
    const dueToday = reminders.filter(r => {
      const dueDate = r.dueDate instanceof Date ? r.dueDate : new Date(r.dueDate);
      return dueDate >= today && dueDate < tomorrow && !r.completed;
    });
    
    const completedToday = reminders.filter(r => {
      if (!r.completedAt) return false;
      const completedDate = r.completedAt instanceof Date ? r.completedAt : new Date(r.completedAt);
      return completedDate >= today && completedDate < tomorrow && r.completed;
    });
    
    const overdue = reminders.filter(r => {
      const dueDate = r.dueDate instanceof Date ? r.dueDate : new Date(r.dueDate);
      return dueDate < today && !r.completed;
    });
    
    return {
      today: dueToday.length,
      completed: completedToday.length,
      overdue: overdue.length,
      total: reminders.length,
      active: reminders.filter(r => !r.completed).length,
      high: reminders.filter(r => !r.completed && isHighPriority(r.priority)).length,
      medium: reminders.filter(r => !r.completed && isMediumPriority(r.priority)).length,
      low: reminders.filter(r => !r.completed && isLowPriority(r.priority)).length,
    };
  }, [reminders]);

  // Initial data load
  useEffect(() => {
    if (user && db && isReady) {
      loadInitialReminders();
    }
  }, [user, db, isReady]);

  // Function to fetch initial reminders
  const loadInitialReminders = useCallback(async () => {
    if (!user || !db) {
      console.log("User or DB not ready, can't load reminders");
      return;
    }
    
    setLoadingStartTime(Date.now());
    setLoading(true);
    
    try {
      const cacheKey = `${user.uid}-${ACTIVE_REMINDERS_KEY}`;
      const cachedData = getCachedReminderList(cacheKey);
      
      if (cachedData) {
        console.log("Using cached reminders:", cachedData.length);
        setReminders(cachedData as UIReminder[]);
        setLoading(false);
        
        // Start a refresh in the background
        refreshRemindersInBackground(cacheKey);
        return;
      }
      
      // Cache miss, need to fetch from server
      console.log("Cache miss, fetching reminders from server");
      
      // First get the total count for pagination
      const countQuery = query(collection(db, "reminders"), where("userId", "==", user.uid));
      const countSnapshot = await getCountFromServer(countQuery);
      const totalReminders = countSnapshot.data().count;
      setTotalCount(totalReminders);
      
      // Then get the first batch of reminders
      const q = query(
        collection(db, "reminders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No reminders found");
        setReminders([]);
        setLastVisible(null);
        setHasMore(false);
      } else {
        const reminderList: UIReminder[] = [];
        
        querySnapshot.forEach((doc) => {
          const reminderData = doc.data();
          const reminder: DatabaseReminder = {
            ...convertTimestampFields(reminderData),
            id: doc.id
          } as DatabaseReminder;
          
          reminderList.push(reminder as UIReminder);
        });
        
        setReminders(reminderList);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(reminderList.length < totalReminders);
        
        // Cache the fetched reminders
        cacheReminderList(cacheKey, reminderList);
      }
      
      // Record load time
      const loadTime = Date.now() - loadingStartTime;
      console.log(`Reminders loaded in ${loadTime}ms`);
      
    } catch (err) {
      console.error("Error loading reminders:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Try to load from localStorage as backup
      try {
        const fallbackData = localStorage.getItem(ACTIVE_REMINDERS_KEY);
        if (fallbackData) {
          const parsed = JSON.parse(fallbackData);
          setReminders(parsed as UIReminder[]);
          console.log("Used fallback data from localStorage");
        }
      } catch (storageErr) {
        console.error("Error loading fallback data:", storageErr);
      }
    } finally {
      setLoading(false);
    }
  }, [user, db, isReady, getCachedReminderList, loadingStartTime]);
  
  // Background refresh function
  const refreshRemindersInBackground = useCallback(async (cacheKey: string) => {
    if (!user || !db || !isReady) return;
    
    try {
      console.log("Starting background refresh");
      
      // First get the total count
      const countQuery = query(collection(db, "reminders"), where("userId", "==", user.uid));
      const countSnapshot = await getCountFromServer(countQuery);
      const totalReminders = countSnapshot.data().count;
      setTotalCount(totalReminders);
      
      // Then get the reminders
      const q = query(
        collection(db, "reminders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No reminders found in background refresh");
        // Don't update reminders here to avoid flickering
        setLastVisible(null);
        setHasMore(false);
      } else {
        const reminderList: UIReminder[] = [];
        
        querySnapshot.forEach((doc) => {
          const reminderData = doc.data();
          const reminder: DatabaseReminder = {
            ...convertTimestampFields(reminderData),
            id: doc.id
          } as DatabaseReminder;
          
          reminderList.push(reminder as UIReminder);
        });
        
        // Update state
        setReminders(prev => {
          // Preserve any pending operations
          const pendingIds = Array.from(pendingReminders.keys());
          const pendingRemindersInState = prev.filter(r => pendingIds.includes(r.id));
          
          // Merge with new data
          const nonPendingReminders = reminderList.filter(r => !pendingIds.includes(r.id));
          return [...pendingRemindersInState, ...nonPendingReminders];
        });
        
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(reminderList.length < totalReminders);
        
        // Cache the fetched reminders
        cacheReminderList(cacheKey, reminderList);
        
        console.log("Background refresh complete");
      }
    } catch (err) {
      console.error("Error in background refresh:", err);
      // Don't set error state for background refresh
    }
  }, [user, db, isReady, cacheReminderList, pendingReminders]);

  // Load more reminders (pagination)
  const loadMoreReminders = useCallback(async () => {
    if (!user || !db || !lastVisible || loading) {
      return;
    }
    
    setLoading(true);
    
    try {
      const q = query(
        collection(db, "reminders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
      } else {
        const reminderList: UIReminder[] = [];
        
        querySnapshot.forEach((doc) => {
          const reminderData = doc.data();
          const reminder: DatabaseReminder = {
            ...convertTimestampFields(reminderData),
            id: doc.id
          } as DatabaseReminder;
          
          reminderList.push(reminder as UIReminder);
        });
        
        setReminders(prev => [...prev, ...reminderList]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(reminders.length + reminderList.length < totalCount);
        
        // Cache the extended list
        const cacheKey = `${user.uid}-${ACTIVE_REMINDERS_KEY}`;
        cacheReminderList(cacheKey, [...reminders, ...reminderList]);
      }
    } catch (err) {
      console.error("Error loading more reminders:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [user, db, lastVisible, loading, reminders, totalCount, cacheReminderList]);

  // Refresh reminders (pull to refresh)
  const refreshReminders = useCallback(async () => {
    if (!user || !db || loading) {
      return false;
    }
    
    setIsRefreshing(true);
    
    try {
      const cacheKey = `${user.uid}-${ACTIVE_REMINDERS_KEY}`;
      await refreshRemindersInBackground(cacheKey);
      
      // Save cache after refresh
      await saveCache();
      
      // Log cache stats
      console.log("Cache stats after refresh:", getCacheStats());
      
      return true;
    } catch (err) {
      console.error("Error refreshing reminders:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [user, db, loading, refreshRemindersInBackground, getCacheStats, saveCache]);

  return {
    reminders,
    loading,
    isRefreshing,
    error,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    reminderStats,
    hasMore,
    totalCount,
    
    // Methods
    loadMoreReminders,
    refreshReminders,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder,
    updateReminder,
    deleteReminder,
    setReminders,
    setTotalCount,
    
    // Batch operations
    batchCompleteReminders,
    batchUpdateReminders,
    batchDeleteReminders,
    
    // Optimistic UI
    isReminderPending,
    pendingReminders
  };
}
