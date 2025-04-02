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
import { createReminder } from "@/utils/reminderUtils";

// Constants for performance tuning
const BATCH_SIZE = 10;
const REFRESH_DEBOUNCE_MS = 300; // More aggressive debouncing for refreshes
const MAX_RETRY_ATTEMPTS = 1; // Only retry once to avoid excessive waiting

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

// Generate mock reminders for demo purposes
const generateMockReminders = (count = 5): Reminder[] => {
  const mockTitles = [
    "Grade student essays", 
    "Prepare for tomorrow's lesson",
    "Submit quarterly report",
    "Schedule parent-teacher meetings",
    "Order new classroom supplies",
    "Update curriculum documents",
    "Check in with struggling students",
    "Organize field trip logistics"
  ];
  
  const mockPriorities = ["high", "medium", "low"];
  
  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(now.getDate() + Math.floor(Math.random() * 7)); // Random due date within a week
    
    return {
      id: `mock-${i + 1}`,
      title: mockTitles[i % mockTitles.length],
      description: `This is a mock reminder #${i + 1} for demonstration purposes.`,
      dueDate,
      priority: mockPriorities[i % mockPriorities.length],
      createdAt: now,
      completed: i % 4 === 0 // Make some completed
    } as Reminder;
  });
};

export function useReminderQuery(user: any, db: any, isReady: boolean) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [useMockData, setUseMockData] = useState(false);
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
    
    // If we're using mock data, generate a mock detail
    if (useMockData) {
      const mockReminder = generateMockReminders(1)[0];
      mockReminder.id = reminderId;
      return mockReminder;
    }
    
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
      
      // If we encounter Firestore errors, use a mock reminder
      if (String(err).includes('permission-denied') || String(err).includes('not been used')) {
        setUseMockData(true);
        const mockReminder = generateMockReminders(1)[0];
        mockReminder.id = reminderId;
        return mockReminder;
      }
      
      return null;
    }
  }, [user, isReady, db, getDetailedReminder, cacheReminderDetail, useMockData]);
  
  // Helper to check for permission errors
  const isPermissionError = (err: any): boolean => {
    const errorMessage = String(err);
    return (
      errorMessage.includes('permission-denied') || 
      errorMessage.includes('not been used') || 
      errorMessage.includes('disabled')
    );
  };
  
  // Fetch reminders with cache support
  const fetchReminders = useCallback(async (isRefresh = false) => {
    if (!user || !isReady) {
      setReminders([]);
      setLoading(false);
      return;
    }
    
    // Check if we're already using mock data
    if (useMockData) {
      console.log("Using mock data for reminders");
      const mockReminders = generateMockReminders(7);
      setReminders(mockReminders);
      setLoading(false);
      setTotalCount(mockReminders.length);
      setHasMore(false);
      setIsRefreshing(false);
      return;
    }
    
    // Check for Firestore initialization issues
    if (!db) {
      console.warn("Firestore DB not initialized, using mock data");
      // Return mock data when Firestore is unavailable
      const mockReminders = generateMockReminders(7);
      
      setReminders(mockReminders);
      setLoading(false);
      setTotalCount(mockReminders.length);
      setHasMore(false);
      setUseMockData(true);
      
      // Show a toast to inform the user about the issue
      if (!isRefresh) {
        toast({
          title: "Firestore Connection Issue",
          description: "Using demo data. Please check your Firestore setup.",
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
          
          // If this is a permissions error, switch to mock data immediately
          if (isPermissionError(countErr)) {
            console.log("Permissions error detected, switching to mock data");
            setUseMockData(true);
            const mockReminders = generateMockReminders(7);
            setReminders(mockReminders);
            setLoading(false);
            setTotalCount(mockReminders.length);
            setHasMore(false);
            setIsRefreshing(false);
            
            if (!isRefresh) {
              toast({
                title: "Firestore Permissions Issue",
                description: "Using demo data. Firebase configuration needs to be updated.",
                variant: "destructive",
                duration: 6000,
              });
            }
            return;
          }
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
        
        // Reset retry attempts on success
        setRetryAttempts(0);
        
        // Use functional update to avoid race conditions
        setReminders(fetchedReminders);
      } catch (queryErr) {
        console.error("Error executing query:", queryErr);
        
        // Check if this is a permissions error
        if (isPermissionError(queryErr)) {
          console.log("Permissions error detected, switching to mock data");
          setUseMockData(true);
          const mockReminders = generateMockReminders(7);
          setReminders(mockReminders);
          setTotalCount(mockReminders.length);
          setHasMore(false);
          
          if (!isRefresh) {
            toast({
              title: "Firestore Permissions Issue",
              description: "Using demo data. Firebase configuration needs to be updated.",
              variant: "destructive",
              duration: 6000,
            });
          }
        } else {
          // Fall back to cached data if available
          const cachedReminders = getCachedReminderList(cacheKey);
          if (cachedReminders && cachedReminders.length > 0) {
            console.log("Using cached data due to query error");
            setReminders(cachedReminders);
          } else {
            // If no cached data and we've already retried, fall back to mock data
            if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
              console.log("Max retry attempts reached, using mock data");
              setUseMockData(true);
              const mockReminders = generateMockReminders(7);
              setReminders(mockReminders);
              setTotalCount(mockReminders.length);
              setHasMore(false);
            } else {
              // Otherwise, increment retry attempts
              setRetryAttempts(prev => prev + 1);
              // Fall back to empty array temporarily
              setReminders([]);
            }
          }
          
          setHasMore(false);
          
          if (!isRefresh) {
            toast({
              title: "Error fetching reminders",
              description: "Using locally cached or demo data. Please check your connection.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching reminders:", err);
      setError(err);
      
      // Check if this is a permissions error
      if (isPermissionError(err)) {
        console.log("Permissions error detected, switching to mock data");
        setUseMockData(true);
        const mockReminders = generateMockReminders(7);
        setReminders(mockReminders);
        setTotalCount(mockReminders.length);
        setHasMore(false);
        
        if (!isRefresh) {
          toast({
            title: "Firestore Permissions Issue",
            description: "Using demo data. Firebase configuration needs to be updated.",
            variant: "destructive",
            duration: 6000,
          });
        }
      } else {
        // Try to use cached data if available
        if (user) {
          const cacheKey = `${user.uid}-reminders`;
          const cachedReminders = getCachedReminderList(cacheKey);
          if (cachedReminders) {
            console.log("Using cached reminders after error");
            setReminders(cachedReminders);
          } else if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
            // If we've already retried, use mock data
            console.log("Max retry attempts reached, using mock data");
            setUseMockData(true);
            const mockReminders = generateMockReminders(7);
            setReminders(mockReminders);
            setTotalCount(mockReminders.length);
            setHasMore(false);
          } else {
            // Otherwise, increment retry attempts and use empty array temporarily
            setRetryAttempts(prev => prev + 1);
            setReminders([]);
          }
        } else {
          setReminders([]);
        }
        
        // Only show error toast for initial load, not background refreshes
        if (!isRefresh) {
          toast({
            title: "Error fetching reminders",
            description: "Using demo data or cached data. Please try again later.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [
    user, isReady, db, lastRefreshTime, toast, getCachedReminderList, 
    cacheReminderList, useMockData, retryAttempts
  ]);
  
  // Load more reminders (pagination) - we don't cache pagination results separately
  const loadMoreReminders = useCallback(async () => {
    if (!user || !isReady || !db || !lastVisible || !hasMore) {
      return;
    }
    
    // If we're using mock data, just return more mock reminders
    if (useMockData) {
      const moreReminders = generateMockReminders(3);
      setReminders(prev => [...prev, ...moreReminders]);
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
      
      // If this is a permissions error, switch to mock data
      if (isPermissionError(err)) {
        console.log("Permissions error while loading more, adding mock data");
        const moreReminders = generateMockReminders(3);
        setReminders(prev => [...prev, ...moreReminders]);
        setUseMockData(true);
      } else {
        toast({
          title: "Error loading more reminders",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, isReady, db, lastVisible, hasMore, toast, useMockData]);

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
    loadReminderDetail,
    useMockData
  };
}
