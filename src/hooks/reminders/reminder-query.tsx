import React from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot,
  getCountFromServer
} from "firebase/firestore";
import { DatabaseReminder } from "@/types/reminderTypes";
import { transformReminder } from "./reminder-transformations";
import { getMockReminders } from "./mock-reminders";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { isMissingIndexError, getFirestoreIndexCreationUrl } from "@/lib/firebase/indexing";

// Cache settings
const CACHE_KEY = 'reminderCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const CACHE_USER_KEY = 'reminderCacheUser';

export function useReminderQuery(user: any, db: any, isReady: boolean, useMockData: boolean = false) {
  const [reminders, setReminders] = useState<DatabaseReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const { toast } = useToast();

  // Function to check cache validity
  const isCacheValid = React.useCallback(() => {
    try {
      const cacheString = localStorage.getItem(CACHE_KEY);
      if (!cacheString) return false;
      
      const cache = JSON.parse(cacheString);
      const cacheUser = localStorage.getItem(CACHE_USER_KEY);
      
      // Make sure cache is for current user
      if (!cacheUser || cacheUser !== user?.uid) return false;
      
      // Check if cache is expired
      const now = Date.now();
      if (!cache.timestamp || now - cache.timestamp > CACHE_EXPIRY) return false;
      
      return true;
    } catch (e) {
      console.error("Error checking cache validity:", e);
      return false;
    }
  }, [user?.uid]);

  // Function to get from cache
  const getFromCache = React.useCallback(() => {
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
  const saveToCache = React.useCallback((data: DatabaseReminder[]) => {
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

  const fetchReminders = React.useCallback(async () => {
    if (!user?.uid || !db || !isReady) {
      return [];
    }

    setError(null);
    
    try {
      // First check for valid cache
      if (isCacheValid()) {
        const cachedData = getFromCache();
        if (cachedData && cachedData.length > 0) {
          console.log("Using cached reminders:", cachedData.length);
          setReminders(cachedData);
          setLoading(false);
          
          // Fetch in background to update cache
          console.log("Background fetching latest data...");
          fetchFromFirebase(true);
          return cachedData;
        }
      }
      
      // No valid cache, fetch directly
      return await fetchFromFirebase();
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      setError(error);
      setLoading(false);
      console.error("Error fetching reminders:", error);
      return [];
    }
  }, [user?.uid, db, isReady, isCacheValid, getFromCache, fetchFromFirebase]);

  const fetchFromFirebase = React.useCallback(async (isBackgroundFetch = false) => {
    if (!user?.uid || !db) {
      return [];
    }

    try {
      if (!isBackgroundFetch) {
        setLoading(true);
      }

      console.log("Fetching reminders for user:", user.uid);

      // If using mock data, return it
      if (useMockData) {
        const mockData = getMockReminders(user.uid);
        setReminders(mockData);
        setLoading(false);
        setHasMore(false);
        setTotalCount(mockData.length);
        return mockData;
      }

      // Get total count first
      try {
        const countQuery = query(
          collection(db, "reminders"),
          where("userId", "==", user.uid)
        );
        const countSnapshot = await getCountFromServer(countQuery);
        const count = countSnapshot.data().count;
        setTotalCount(count);
        console.log("Total reminders:", count);
      } catch (countError) {
        console.warn("Could not get count", countError);
      }
      
      // First try with the complex query that needs composite index
      let fetchedReminders: DatabaseReminder[] = [];
      let lastDoc: QueryDocumentSnapshot | null = null;
      
      try {
        console.log("Trying query with composite index (userId, dueDate, priority)");
        const indexQuery = query(
          collection(db, "reminders"),
          where("userId", "==", user.uid),
          orderBy("dueDate", "asc"),
          orderBy("priority", "desc"),
          limit(50)
        );
        
        const querySnapshot = await getDocs(indexQuery);
        lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const reminder = transformReminder(doc.id, data);
          fetchedReminders.push(reminder);
        });
        
        console.log(`Fetched ${fetchedReminders.length} reminders with composite index`);
      } catch (indexError) {
        // If the index error occurs, fallback to a simpler query
        if (isMissingIndexError(indexError)) {
          console.log("Composite index not ready, using simplified query");
          
          // Show a toast with the index creation link
          const indexUrl = getFirestoreIndexCreationUrl("reminders", ["userId", "dueDate", "priority"]);
          if (indexUrl) {
            toast({
              title: "Missing Firestore Index",
              description: "A database index is needed for optimal performance. Click 'Create Index' to fix.",
              variant: "destructive",
              action: indexUrl ? (
                <ToastAction 
                  altText="Create Index"
                  onClick={() => window.open(indexUrl, '_blank')}
                >
                  Create Index
                </ToastAction>
              ) : undefined,
              duration: 10000
            });
          }
          
          // Use a simpler query as fallback
          const simpleQuery = query(
            collection(db, "reminders"),
            where("userId", "==", user.uid),
            orderBy("dueDate", "asc"),
            limit(50)
          );
          
          const fallbackSnapshot = await getDocs(simpleQuery);
          lastDoc = fallbackSnapshot.docs[fallbackSnapshot.docs.length - 1] || null;
          
          fetchedReminders = [];
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data();
            const reminder = transformReminder(doc.id, data);
            fetchedReminders.push(reminder);
          });
          
          console.log(`Fetched ${fetchedReminders.length} reminders with simpler query`);
        } else {
          // Re-throw if it's not an index error
          throw indexError;
        }
      }

      // Set the last visible document for pagination
      setLastVisible(lastDoc);
      setHasMore(fetchedReminders.length >= 50);

      // Save to cache
      saveToCache(fetchedReminders);
      
      if (!isBackgroundFetch) {
        setReminders(fetchedReminders);
        setLoading(false);
      }

      return fetchedReminders;
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      
      if (!isBackgroundFetch) {
        setError(error);
        setLoading(false);
      }
      
      console.error("Error fetching reminders from Firebase:", error);
      return [];
    }
  }, [user?.uid, db, useMockData, saveToCache, toast]);

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
