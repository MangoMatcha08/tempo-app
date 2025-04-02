
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, Firestore, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { Reminder } from '@/types/reminderTypes';
import { useFirestore } from '@/contexts/FirestoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { useReminderOperations } from './reminder-operations';
import { useReminderQueryCore } from './use-reminder-query-core';
import { useReminderCache } from './use-reminder-cache';
import { useFirestoreIndexes } from './use-firestore-indexes';
import { 
  transformReminders, 
  filterUrgentReminders, 
  filterUpcomingReminders, 
  filterCompletedReminders 
} from './reminder-transformations';
import { calculateReminderStats } from './reminder-stats';

export const useReminders = () => {
  const { user } = useAuth();
  const { db, isReady } = useFirestore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Get cached reminders
  const { 
    getCachedReminders, 
    setCachedReminders, 
    clearReminderCache,
    isCacheStale 
  } = useReminderCache();

  // Get reminder operations
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
    error: operationsError
  } = useReminderOperations(user, db, isReady);
  
  // Use useFirestoreIndexes hook
  const firestoreIndexes = useFirestoreIndexes();
  
  // Create fetchReminders function
  const fetchReminders = useCallback(async (lastItem?: Reminder) => {
    if (!isReady || !user || !db) {
      throw new Error('Not ready to fetch reminders');
    }

    try {
      const remindersRef = collection(db, 'reminders');
      
      // Create query
      let remindersQuery = query(
        remindersRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      // Get documents
      const snapshot = await getDocs(remindersQuery);
      
      // Process results
      const fetchedReminders: Reminder[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        fetchedReminders.push({
          id: doc.id,
          title: data.title,
          description: data.description || '',
          dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate),
          priority: data.priority,
          completed: data.completed || false,
          completedAt: data.completedAt ? 
            (data.completedAt instanceof Timestamp ? data.completedAt.toDate() : new Date(data.completedAt)) 
            : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          userId: data.userId
        });
      });
      
      return fetchedReminders;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }, [db, isReady, user]);

  // Create fetchReminderCount function
  const fetchReminderCount = useCallback(async () => {
    if (!isReady || !user || !db) return null;
    
    try {
      const remindersRef = collection(db, 'reminders');
      const countQuery = query(
        remindersRef,
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(countQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching reminder count:', error);
      return null;
    }
  }, [db, isReady, user]);

  // Create getReminderById function
  const getReminderById = useCallback(async (id: string) => {
    // Implementation left as an exercise as it's not used in the errors
    return null;
  }, []);

  // Transform and filter reminders
  const urgentReminders = useMemo(() => 
    filterUrgentReminders(transformReminders(reminders)), 
    [reminders]
  );
  
  const upcomingReminders = useMemo(() => 
    filterUpcomingReminders(transformReminders(reminders)), 
    [reminders]
  );
  
  const completedReminders = useMemo(() => 
    filterCompletedReminders(transformReminders(reminders)), 
    [reminders]
  );
  
  // Calculate reminder stats
  const reminderStats = useMemo(() => 
    calculateReminderStats(reminders), 
    [reminders]
  );

  // Load initial reminders
  useEffect(() => {
    if (!isReady || !user) {
      console.log('Not ready to load reminders');
      return;
    }
    
    console.log('Initiating initial fetch of reminders');
    
    // First check cache
    const cachedData = getCachedReminders();
    if (cachedData.reminders.length > 0) {
      console.log(`Using cached reminders: ${cachedData.reminders.length}`);
      setReminders(cachedData.reminders);
      setTotalCount(cachedData.totalCount || cachedData.reminders.length);
      setLoading(false);
      
      // If cache is stale, refresh in background
      if (isCacheStale()) {
        console.log('Background fetching latest data...');
        setIsRefreshing(true);
        refreshReminders().finally(() => {
          setIsRefreshing(false);
        });
      }
    } else {
      // No cache, do initial load
      loadReminders();
    }
  }, [isReady, user, db]);

  // Handle operations errors
  useEffect(() => {
    if (operationsError) {
      setError(operationsError);
    }
  }, [operationsError]);

  // Load reminders from Firestore
  const loadReminders = useCallback(async (lastItem?: Reminder) => {
    if (!isReady || !user || !db) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching reminders for user: ${user.uid}`);
      const fetchedReminders = await fetchReminders(lastItem);
      
      // If initial load, replace reminders
      if (!lastItem) {
        setReminders(fetchedReminders);
        
        // Save to cache
        setCachedReminders(fetchedReminders, totalCount || fetchedReminders.length);
      } else {
        // If loading more, append reminders
        setReminders(prev => {
          const newList = [...prev, ...fetchedReminders];
          
          // Save to cache
          setCachedReminders(newList, totalCount || newList.length);
          
          return newList;
        });
      }
      
      // Update has more
      setHasMore(fetchedReminders.length > 0);
      
      // Try to get count of all reminders
      try {
        const count = await fetchReminderCount();
        if (count !== null) {
          setTotalCount(count);
        }
      } catch (countError) {
        console.warn('Error getting count, continuing without count:', countError);
      }
      
      console.log(`Fetched ${fetchedReminders.length} reminders`);
      console.log('Initial fetch completed successfully');
      
      return true;
    } catch (err) {
      console.error('Error loading reminders:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setLoading(false);
    }
  }, [isReady, user, db, fetchReminders, fetchReminderCount, setCachedReminders, totalCount]);

  // Load more reminders
  const loadMoreReminders = useCallback(async () => {
    if (loading || !hasMore || reminders.length === 0) return false;
    
    const lastReminder = reminders[reminders.length - 1];
    return loadReminders(lastReminder);
  }, [loading, hasMore, reminders, loadReminders]);

  // Refresh reminders
  const refreshReminders = useCallback(async () => {
    if (!isReady || !user || !db) return false;
    
    setIsRefreshing(true);
    
    try {
      const success = await loadReminders();
      return success;
    } finally {
      setIsRefreshing(false);
    }
  }, [isReady, user, db, loadReminders]);

  // New optimized addReminder that immediately adds to state for faster UI updates
  const optimizedAddReminder = useCallback(async (reminderData: any) => {
    if (!user) return null;
    
    try {
      // Immediately add to local state to make UI responsive
      const optimisticId = `temp-${Date.now()}`;
      const optimisticReminder = {
        ...reminderData,
        id: optimisticId,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOptimistic: true  // Flag to identify this is temporary
      };
      
      setReminders(prev => [optimisticReminder, ...prev]);
      
      // Then perform the actual add operation
      const result = await addReminder(reminderData);
      
      if (result) {
        // Replace the optimistic entry with the real one
        setReminders(prev => 
          prev.map(r => r.id === optimisticId ? result : r)
        );
        
        // Update cache
        setCachedReminders(
          reminders.map(r => r.id === optimisticId ? result : r),
          totalCount + 1
        );
        
        return result;
      } else {
        // If failed, remove the optimistic entry
        setReminders(prev => prev.filter(r => r.id !== optimisticId));
        return null;
      }
    } catch (err) {
      console.error('Error adding reminder:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, [user, addReminder, setCachedReminders, reminders, totalCount]);

  return {
    reminders,
    loading,
    error,
    isRefreshing,
    urgentReminders,
    upcomingReminders,
    completedReminders,
    reminderStats,
    handleCompleteReminder,
    handleUndoComplete,
    addReminder: optimizedAddReminder,  // Use the optimized version
    updateReminder,
    deleteReminder,
    loadMoreReminders,
    refreshReminders,
    clearReminderCache,
    hasMore,
    totalCount,
    // Expose state setters for batch operations
    setReminders,
    setTotalCount,
    // Batch operations
    batchCompleteReminders,
    batchAddReminders,
    batchUpdateReminders,
    batchDeleteReminders
  };
};
