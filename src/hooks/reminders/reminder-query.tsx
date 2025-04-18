import { useState, useCallback } from 'react';
import { DatabaseReminder } from "@/types/reminderTypes";
import { useReminderQueryCache } from './use-reminder-query-cache';
import { useReminderQueryFirebase } from './use-reminder-query-firebase';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export function useReminderQuery(user: any, db: any, isReady: boolean, useMockData: boolean = false) {
  const [reminders, setReminders] = useState<DatabaseReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  const { isCacheValid, getFromCache, saveToCache } = useReminderQueryCache(user);
  const { fetchFromFirebase } = useReminderQueryFirebase(user, db, useMockData);

  const fetchReminders = useCallback(async () => {
    if (!user?.uid || !db || !isReady) {
      return [];
    }

    setError(null);
    
    try {
      if (isCacheValid()) {
        const cachedData = getFromCache();
        if (cachedData && cachedData.length > 0) {
          console.log("Using cached reminders:", cachedData.length);
          setReminders(cachedData);
          setLoading(false);
          
          console.log("Background fetching latest data...");
          fetchFromFirebase(true);
          return cachedData;
        }
      }
      
      const fetchedReminders = await fetchFromFirebase();
      saveToCache(fetchedReminders);
      setReminders(fetchedReminders);
      setLoading(false);
      return fetchedReminders;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      setLoading(false);
      console.error("Error fetching reminders:", error);
      return [];
    }
  }, [user?.uid, db, isReady, isCacheValid, getFromCache, fetchFromFirebase, saveToCache]);

  const loadMoreReminders = React.useCallback(async () => {
    if (!user?.uid || !db || !isReady || !lastVisible || !hasMore) {
      return;
    }

    try {
      setIsRefreshing(true);
      
      // Create a fallback query that should work even without the composite index
      let nextQuery = query(
        collection(db, "reminders"),
        where("userId", "==", user.uid),
        orderBy("dueDate", "asc"),
        startAfter(lastVisible),
        limit(20)
      );

      try {
        // Try to use the query with the composite index first
        nextQuery = query(
          collection(db, "reminders"),
          where("userId", "==", user.uid), 
          orderBy("dueDate", "asc"),
          orderBy("priority", "desc"),
          startAfter(lastVisible),
          limit(20)
        );
      } catch (indexError) {
        console.log("Using simplified pagination query");
      }

      const querySnapshot = await getDocs(nextQuery);
      const newReminders: DatabaseReminder[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const reminder = transformReminder(doc.id, data);
        newReminders.push(reminder);
      });

      // Update the last visible document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc || null);
      
      // Update whether there are more reminders to load
      setHasMore(querySnapshot.docs.length === 20);

      // Update reminders state by appending new reminders
      setReminders((prevReminders) => [...prevReminders, ...newReminders]);
      setIsRefreshing(false);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      setIsRefreshing(false);
      console.error("Error loading more reminders:", error);
    }
  }, [user?.uid, db, isReady, lastVisible, hasMore]);

  const refreshReminders = React.useCallback(async () => {
    setIsRefreshing(true);
    setLastVisible(null); // Reset pagination
    
    try {
      const result = await fetchReminders();
      setIsRefreshing(false);
      return result;
    } catch (e) {
      setIsRefreshing(false);
      throw e;
    }
  }, [fetchReminders]);

  const loadReminderDetail = React.useCallback(
    async (reminderId: string): Promise<DatabaseReminder | null> => {
      if (!db || !isReady) {
        return null;
      }

      try {
        const reminderDoc = await getDoc(doc(db, "reminders", reminderId));
        
        if (reminderDoc.exists()) {
          const data = reminderDoc.data();
          return transformReminder(reminderDoc.id, data);
        }
        
        return null;
      } catch (e) {
        console.error("Error loading reminder detail:", e);
        return null;
      }
    },
    [db, isReady]
  );

  return {
    reminders,
    setReminders,
    loading,
    error,
    totalCount,
    setTotalCount,
    hasMore,
    isRefreshing,
    fetchReminders,
    loadMoreReminders,
    refreshReminders,
    loadReminderDetail,
    useMockData
  };
}
