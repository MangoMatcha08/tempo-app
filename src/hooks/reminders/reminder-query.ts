
import { useState, useCallback } from "react";
import { Reminder } from "@/types/reminderTypes";
import { 
  collection, getDocs, query, where, orderBy, 
  limit, startAfter, QuerySnapshot, DocumentData, 
  getCountFromServer, Timestamp, 
  getDocsFromServer, getDoc, doc
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useReminderCache } from "./use-reminder-cache";

// Constants for performance tuning
const BATCH_SIZE = 10;
const REFRESH_DEBOUNCE_MS = 300; // More aggressive debouncing for refreshes

// Fields to select for list views (index-only query)
const LIST_VIEW_FIELDS = [
  'id', 
  'title', 
  'dueDate', 
  'priority', 
  'completed', 
  'completedAt', 
  'createdAt'
];

export function useReminderQuery(user: any, db: any, isReady: boolean) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { 
    cacheReminderList, 
    getCachedReminderList,
    invalidateUserCache,
    getDetailedReminder,
    cacheReminderDetail
  } = useReminderCache();
  
  // Process query snapshot into typed reminders
  const processQuerySnapshot = (querySnapshot: QuerySnapshot<DocumentData>, selectFields = false) => {
    const fetchedReminders: Reminder[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      try {
        const dueDate = data.dueDate instanceof Timestamp 
          ? data.dueDate.toDate() 
          : new Date(data.dueDate);
          
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : data.createdAt ? new Date(data.createdAt) : new Date();
          
        const completedAt = data.completedAt instanceof Timestamp 
          ? data.completedAt.toDate() 
          : data.completedAt ? new Date(data.completedAt) : undefined;
        
        let reminder: Reminder;
        
        if (selectFields) {
          // For list views, only select the necessary fields
          reminder = {
            id: doc.id,
            title: data.title,
            description: data.description || "",  // Include minimal description for preview
            dueDate,
            priority: data.priority,
            completed: data.completed || false,
            completedAt,
            createdAt
          } as Reminder;
        } else {
          // For detailed views, select all fields
          reminder = {
            ...data,
            id: doc.id,
            dueDate,
            createdAt,
            completedAt
          } as Reminder;
        }
        
        fetchedReminders.push(reminder);
      } catch (err) {
        console.error("Error processing reminder document:", doc.id, err);
        // Continue processing other documents
      }
    });
    
    return fetchedReminders;
  };
  
  // Load a specific reminder with all fields
  const loadReminderDetail = useCallback(async (reminderId: string) => {
    if (!user || !isReady || !db) return null;
    
    // Check cache first
    const cachedReminder = getDetailedReminder(reminderId);
    if (cachedReminder) {
      console.log(`Using cached detail for reminder ${reminderId}`);
      return cachedReminder;
    }
    
    try {
      const reminderRef = doc(db, "reminders", reminderId);
      const reminderSnap = await getDoc(reminderRef);
      
      if (reminderSnap.exists()) {
        const data = reminderSnap.data();
        
        // Process fields
        const dueDate = data.dueDate instanceof Timestamp 
          ? data.dueDate.toDate() 
          : new Date(data.dueDate);
          
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : data.createdAt ? new Date(data.createdAt) : new Date();
          
        const completedAt = data.completedAt instanceof Timestamp 
          ? data.completedAt.toDate() 
          : data.completedAt ? new Date(data.completedAt) : undefined;
        
        const reminder: Reminder = {
          ...data,
          id: reminderSnap.id,
          dueDate,
          createdAt,
          completedAt
        } as Reminder;
        
        // Cache the detailed reminder
        cacheReminderDetail(reminder);
        
        return reminder;
      }
      
      return null;
    } catch (err) {
      console.error(`Error loading detail for reminder ${reminderId}:`, err);
      return null;
    }
  }, [user, isReady, db, getDetailedReminder, cacheReminderDetail]);
  
  // Fetch reminders with cache support
  const fetchReminders = useCallback(async (isRefresh = false) => {
    if (!user || !isReady) {
      setReminders([]);
      setLoading(false);
      return;
    }
    
    // Check for Firestore initialization issues
    if (!db) {
      console.warn("Firestore DB not initialized, using mock data");
      // Return mock data when Firestore is unavailable
      const mockReminders: Reminder[] = [
        {
          id: "mock-1",
          title: "Example Reminder",
          description: "This is a mock reminder because Firestore is not available",
          dueDate: new Date(),
          priority: "medium",
          createdAt: new Date(),
          completed: false
        }
      ];
      
      setReminders(mockReminders);
      setLoading(false);
      setTotalCount(1);
      setHasMore(false);
      
      // Show a toast to inform the user about the issue
      if (!isRefresh) {
        toast({
          title: "Firestore Connection Issue",
          description: "Using mock data. Please check your Firestore setup.",
          variant: "destructive",
        });
      }
      
      return;
    }
    
    try {
      // Skip if this is a background refresh and we've recently refreshed
      const now = Date.now();
      if (isRefresh && now - lastRefreshTime < REFRESH_DEBOUNCE_MS) {
        console.log("Skipping refresh - too soon since last refresh");
        return;
      }
      
      // Get cache key for this user's reminders
      const cacheKey = `${user.uid}-reminders`;
      
      // Check cache first for non-refresh operations
      if (!isRefresh) {
        const cachedReminders = getCachedReminderList(cacheKey);
        if (cachedReminders) {
          console.log("Using cached reminders:", cachedReminders.length);
          setReminders(cachedReminders);
          setLoading(false);
          
          // Still fetch in the background to update the cache, but don't show loading state
          console.log("Background fetching latest data...");
        } else {
          // Only show loading indicator if we don't have cached data
          setLoading(true);
        }
      } else {
        // For refresh operations, set the refreshing state
        setIsRefreshing(true);
      }
      
      setError(null);
      console.log("Fetching reminders for user:", user.uid);
      const startTime = performance.now();
      setLastRefreshTime(now);
      
      const remindersRef = collection(db, "reminders");
      
      // Optimize count query for initial load only
      if (!isRefresh) {
        try {
          const countQuery = query(remindersRef, where("userId", "==", user.uid));
          const countSnapshot = await getCountFromServer(countQuery);
          const count = countSnapshot.data().count;
          setTotalCount(count);
          console.log(`Total reminders: ${count}`);
          
          if (count === 0) {
            setReminders([]);
            setLoading(false);
            setIsRefreshing(false);
            setHasMore(false);
            
            // Cache empty result
            cacheReminderList(cacheKey, []);
            return;
          }
        } catch (countErr) {
          console.warn("Error getting count, continuing without count:", countErr);
          // Proceed without the count
        }
      }
      
      // Build optimized query - sorting by createdAt still makes sense for newest items first
      const q = query(
        remindersRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(BATCH_SIZE)
      );
      
      try {
        // For better performance, use getDocsFromServer for refreshes (bypass cache)
        // and regular getDocs for initial loads (leverage Firestore cache)
        const querySnapshot = isRefresh 
          ? await getDocsFromServer(q)
          : await getDocs(q);
        
        if (!querySnapshot.empty) {
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          setHasMore(querySnapshot.size === BATCH_SIZE);
        } else {
          setLastVisible(null);
          setHasMore(false);
        }
        
        // Use index-only queries for list views
        const fetchedReminders = processQuerySnapshot(querySnapshot, true);
        
        const endTime = performance.now();
        console.log(`Fetched ${fetchedReminders.length} reminders in ${(endTime - startTime).toFixed(2)}ms`);
        
        // Cache the results
        cacheReminderList(cacheKey, fetchedReminders);
        
        // Use functional update to avoid race conditions
        setReminders(fetchedReminders);
      } catch (queryErr) {
        console.error("Error executing query:", queryErr);
        
        // Fall back to cached data if available
        const cachedReminders = getCachedReminderList(cacheKey);
        if (cachedReminders && cachedReminders.length > 0) {
          console.log("Using cached data due to query error");
          setReminders(cachedReminders);
        } else {
          // If no cached data, fall back to empty array
          setReminders([]);
        }
        
        setHasMore(false);
        
        if (!isRefresh) {
          toast({
            title: "Error fetching reminders",
            description: "Using locally cached data. Please check your connection.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching reminders:", err);
      setError(err);
      
      // Try to use cached data if available
      if (user) {
        const cacheKey = `${user.uid}-reminders`;
        const cachedReminders = getCachedReminderList(cacheKey);
        if (cachedReminders) {
          console.log("Using cached reminders after error");
          setReminders(cachedReminders);
        } else {
          setReminders([]);
        }
      } else {
        setReminders([]);
      }
      
      // Only show error toast for initial load, not background refreshes
      if (!isRefresh) {
        toast({
          title: "Error fetching reminders",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isReady, db, lastRefreshTime, toast, getCachedReminderList, cacheReminderList]);
  
  // Load more reminders (pagination) - we don't cache pagination results separately
  const loadMoreReminders = useCallback(async () => {
    if (!user || !isReady || !db || !lastVisible || !hasMore) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const remindersRef = collection(db, "reminders");
      const q = query(
        remindersRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(BATCH_SIZE)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.size === BATCH_SIZE);
        
        // Use index-only queries for list views
        const newReminders = processQuerySnapshot(querySnapshot, true);
        // Use functional update to avoid race conditions
        setReminders(prev => [...prev, ...newReminders]);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Error loading more reminders:", err);
      setError(err);
      toast({
        title: "Error loading more reminders",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isReady, db, lastVisible, hasMore, toast]);

  // Optimized refresh function that also invalidates cache
  const refreshReminders = useCallback(async () => {
    if (user) {
      // Invalidate cache before refreshing
      invalidateUserCache(user.uid);
    }
    return fetchReminders(true);
  }, [fetchReminders, invalidateUserCache, user]);

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
    loadReminderDetail
  };
}
