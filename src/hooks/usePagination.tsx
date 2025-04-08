
import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from "@/contexts/FirestoreContext";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  Query
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useCachePerformance } from './useCachePerformance';

// Options for pagination
export interface PaginationOptions<T> {
  collectionName: string;
  pageSize: number;
  orderByField: string;
  orderDirection?: 'asc' | 'desc';
  whereConditions?: Array<[string, '==' | '!=' | '>' | '>=' | '<' | '<=', any]>;
  transformDataFn?: (doc: DocumentData) => T;
  cacheKey?: string;
  enablePerformanceTracking?: boolean;
}

// Return type for the pagination hook
export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  goToPage: (page: number) => Promise<void>;
  goToNextPage: () => Promise<void>;
  goToPreviousPage: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  resetPagination: () => void;
  performance: {
    averageLoadTime: number;
    cacheHitRate: number;
    memoryUsage: number | null;
  };
}

// Cache structure for pagination
interface PaginationCache<T> {
  items: T[];
  totalItems: number;
  lastVisible: QueryDocumentSnapshot | null;
  timestamp: number;
  queryHash: string;
}

// Calculate a hash for the query to use as cache key
const getQueryHash = (
  collectionName: string, 
  orderByField: string, 
  orderDirection: 'asc' | 'desc',
  whereConditions?: Array<[string, '==' | '!=' | '>' | '>=' | '<' | '<=', any]>
) => {
  const whereString = whereConditions 
    ? whereConditions.map(c => `${c[0]}${c[1]}${String(c[2])}`).join(',')
    : '';
  return `${collectionName}-${orderByField}-${orderDirection}-${whereString}`;
};

/**
 * Custom hook providing cursor-based Firebase pagination with caching
 */
export function usePagination<T>(
  options: PaginationOptions<T>
): PaginationResult<T> {
  // Extract options with defaults
  const {
    collectionName,
    pageSize = 10,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    whereConditions,
    transformDataFn = (doc: DocumentData) => doc.data() as T,
    cacheKey: userCacheKey,
    enablePerformanceTracking = true,
  } = options;

  const { db, isReady, isOnline } = useFirestore();
  const { toast } = useToast();
  
  // State for pagination
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageSnapshots, setPageSnapshots] = useState<Record<number, QueryDocumentSnapshot>>({});
  
  // Generate cache key based on query parameters or use user-provided key
  const queryHash = getQueryHash(collectionName, orderByField, orderDirection, whereConditions);
  const cacheKey = userCacheKey || queryHash;
  
  // Performance monitoring
  const {
    metrics,
    recordHit,
    recordMiss,
    resetMetrics,
    logMetrics
  } = useCachePerformance({
    enabled: enablePerformanceTracking,
    logToConsole: process.env.NODE_ENV === 'development',
    logFrequency: 60000, // Log every minute
    sampleRate: 1.0 // Measure all operations in this critical component
  });
  
  // Save state for persistence between navigation
  useEffect(() => {
    try {
      // Store current pagination state in sessionStorage to preserve between navigation
      if (items.length > 0) {
        sessionStorage.setItem(`pagination-${cacheKey}-page`, String(currentPage));
      }
    } catch (err) {
      console.error("Error saving pagination state:", err);
    }
  }, [currentPage, items.length, cacheKey]);
  
  // Restore previous session state if available
  useEffect(() => {
    try {
      const storedPage = sessionStorage.getItem(`pagination-${cacheKey}-page`);
      if (storedPage && !isLoading) {
        const parsedPage = parseInt(storedPage, 10);
        if (!isNaN(parsedPage) && parsedPage > 0 && parsedPage !== currentPage) {
          setCurrentPage(parsedPage);
        }
      }
    } catch (err) {
      console.error("Error restoring pagination state:", err);
    }
  }, [cacheKey]);
  
  // Cache management
  const saveToCache = useCallback((page: number, data: PaginationCache<T>) => {
    try {
      const cacheData = {
        ...data,
        timestamp: Date.now(),
        queryHash
      };
      
      localStorage.setItem(`pagination-${cacheKey}-${page}`, JSON.stringify(cacheData));
      localStorage.setItem(`pagination-${cacheKey}-metadata`, JSON.stringify({
        totalItems: data.totalItems,
        totalPages: Math.ceil(data.totalItems / pageSize),
        lastUpdated: Date.now(),
        queryHash
      }));
    } catch (err) {
      console.error("Error saving pagination cache:", err);
    }
  }, [cacheKey, queryHash, pageSize]);

  const getFromCache = useCallback((page: number): PaginationCache<T> | null => {
    try {
      const startTime = performance.now();
      const cacheStr = localStorage.getItem(`pagination-${cacheKey}-${page}`);
      
      if (!cacheStr) {
        recordMiss(performance.now() - startTime);
        return null;
      }
      
      const cache = JSON.parse(cacheStr) as PaginationCache<T>;
      
      // Validate cache is for the same query
      if (cache.queryHash !== queryHash) {
        recordMiss(performance.now() - startTime);
        return null;
      }
      
      // Check if cache is still valid (30 minutes)
      if (Date.now() - cache.timestamp > 30 * 60 * 1000) {
        recordMiss(performance.now() - startTime);
        return null;
      }
      
      recordHit(performance.now() - startTime, cache.items.length);
      return cache;
    } catch (err) {
      console.error("Error reading pagination cache:", err);
      return null;
    }
  }, [cacheKey, queryHash, recordMiss, recordHit]);

  // Clear cache for this pagination instance
  const clearCache = useCallback(() => {
    try {
      // Find all localStorage items with the cacheKey prefix and remove them
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`pagination-${cacheKey}`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} cache items for ${cacheKey}`);
    } catch (err) {
      console.error("Error clearing pagination cache:", err);
    }
  }, [cacheKey]);

  // Build the query based on options
  const buildQuery = useCallback((pageNum: number, startAfterDoc?: QueryDocumentSnapshot) => {
    if (!db || !isReady) return null;
    
    try {
      const collectionRef = collection(db, collectionName);
      
      let q: Query = query(collectionRef);
      
      // Add where conditions if provided
      if (whereConditions && whereConditions.length > 0) {
        whereConditions.forEach(condition => {
          q = query(q, where(condition[0], condition[1], condition[2]));
        });
      }
      
      // Add orderBy
      q = query(q, orderBy(orderByField, orderDirection));
      
      // Add pagination (startAfter if not first page and we have a document to start after)
      const skipCount = (pageNum - 1) * pageSize;
      if (pageNum > 1 && startAfterDoc) {
        q = query(q, startAfter(startAfterDoc), limit(pageSize));
      } else {
        q = query(q, limit(pageSize));
      }
      
      return q;
    } catch (err) {
      console.error("Error building query:", err);
      setError(err instanceof Error ? err : new Error('Error building query'));
      return null;
    }
  }, [db, isReady, collectionName, whereConditions, orderByField, orderDirection, pageSize]);

  // Load data for a specific page
  const loadPage = useCallback(async (pageNum: number): Promise<boolean> => {
    if (!isReady || !db) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get data from cache first
      const cachedData = isOnline ? getFromCache(pageNum) : null;
      
      if (cachedData) {
        console.log(`Using cached data for page ${pageNum}`);
        setItems(cachedData.items);
        setTotalItems(cachedData.totalItems);
        setTotalPages(Math.ceil(cachedData.totalItems / pageSize));
        setCurrentPage(pageNum);
        setHasMore(pageNum * pageSize < cachedData.totalItems);
        setIsLoading(false);
        
        // If we're online, still fetch in the background to update cache
        if (isOnline) {
          setTimeout(() => {
            fetchPage(pageNum).catch(console.error);
          }, 100);
        }
        
        return true;
      }
      
      // Not in cache or cache invalid, fetch from Firestore
      return await fetchPage(pageNum);
      
    } catch (err) {
      console.error("Error loading page:", err);
      setError(err instanceof Error ? err : new Error('Error loading page'));
      setIsLoading(false);
      return false;
    }
  }, [db, isReady, isOnline, getFromCache, pageSize]);
  
  // Fetch page from Firestore
  const fetchPage = useCallback(async (pageNum: number): Promise<boolean> => {
    if (!db || !isReady) return false;
    
    try {
      const startTime = performance.now();
      
      // Get the snapshot to start after (for pages beyond first)
      let startAfterDoc = pageNum > 1 ? pageSnapshots[pageNum - 1] || null : null;
      
      // If we don't have the previous page's snapshot but we need one, we have to fetch all previous pages
      if (pageNum > 1 && !startAfterDoc) {
        // Check if we have any previous page snapshot that's closer
        let closestPage = 0;
        let closestSnapshot: QueryDocumentSnapshot | null = null;
        
        Object.entries(pageSnapshots).forEach(([page, snapshot]) => {
          const pageNumber = parseInt(page, 10);
          if (pageNumber < pageNum && pageNumber > closestPage) {
            closestPage = pageNumber;
            closestSnapshot = snapshot;
          }
        });
        
        if (closestPage > 0 && closestSnapshot) {
          // We have a closer starting point than page 1
          startAfterDoc = closestSnapshot;
          
          // We need to fetch pages from closestPage+1 up to pageNum
          let currentPageToFetch = closestPage + 1;
          let currentStartAfterDoc = closestSnapshot;
          
          while (currentPageToFetch < pageNum) {
            const q = buildQuery(currentPageToFetch, currentStartAfterDoc);
            if (!q) throw new Error("Failed to build query");
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              // No more data, can't reach the requested page
              setHasMore(false);
              setIsLoading(false);
              return false;
            }
            
            // Save this snapshot
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setPageSnapshots(prev => ({
              ...prev,
              [currentPageToFetch]: lastDoc
            }));
            
            currentStartAfterDoc = lastDoc;
            currentPageToFetch++;
          }
          
          // Now we have the snapshot for the page before the one we want
          startAfterDoc = currentStartAfterDoc;
        } else {
          // We have to start from the beginning
          let currentPage = 1;
          let startAfterDoc: QueryDocumentSnapshot | null = null;
          
          while (currentPage < pageNum) {
            const q = buildQuery(currentPage, startAfterDoc);
            if (!q) throw new Error("Failed to build query");
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
              // No more data, can't reach the requested page
              setHasMore(false);
              setIsLoading(false);
              return false;
            }
            
            // Save this snapshot
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setPageSnapshots(prev => ({
              ...prev,
              [currentPage]: lastDoc
            }));
            
            startAfterDoc = lastDoc;
            currentPage++;
          }
        }
      }
      
      // Build the query for the current page
      const q = buildQuery(pageNum, startAfterDoc);
      if (!q) throw new Error("Failed to build query");
      
      // Get count for first page load or refresh
      if (pageNum === 1 || totalItems === 0) {
        try {
          // We'll use the length of results to estimate total for now
          // A proper count would require another query
          console.log("Will estimate total from results length");
        } catch (countErr) {
          console.error("Error getting count:", countErr);
          // Continue with query, we'll get approximate count
        }
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Process results
      const results: T[] = [];
      querySnapshot.forEach((doc) => {
        results.push(transformDataFn(doc));
      });
      
      // Save the last document for pagination
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc);
        
        // Save this snapshot for direct pagination
        setPageSnapshots(prev => ({
          ...prev,
          [pageNum]: lastDoc
        }));
      } else {
        setLastVisible(null);
      }
      
      // Update state
      setItems(results);
      setCurrentPage(pageNum);
      
      // Calculate total items and pages if we don't have them
      if (totalItems === 0) {
        // Estimate total based on current page results
        // This is an approximation - if we have a full page, there might be more
        const estimatedTotal = querySnapshot.empty 
          ? (pageNum - 1) * pageSize 
          : (pageNum - 1) * pageSize + querySnapshot.size;
          
        const hasMoreItems = querySnapshot.size === pageSize;
        
        setTotalItems(estimatedTotal);
        setTotalPages(Math.max(1, Math.ceil(estimatedTotal / pageSize)));
        setHasMore(hasMoreItems);
      } else {
        // We already have a total count, just update hasMore
        setHasMore(pageNum * pageSize < totalItems);
      }
      
      // Cache the results
      const loadTime = performance.now() - startTime;
      saveToCache(pageNum, {
        items: results,
        totalItems: totalItems || results.length,
        lastVisible: querySnapshot.empty ? null : querySnapshot.docs[querySnapshot.docs.length - 1],
        timestamp: Date.now(),
        queryHash
      });
      
      // Log performance info
      if (enablePerformanceTracking) {
        console.log(`Page ${pageNum} loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      setIsLoading(false);
      return true;
      
    } catch (err) {
      console.error("Error fetching page:", err);
      setError(err instanceof Error ? err : new Error('Error fetching page'));
      setIsLoading(false);
      
      // Try to show cached data if available in case of error
      const cachedData = getFromCache(pageNum);
      if (cachedData) {
        console.log("Using cached data after fetch error");
        setItems(cachedData.items);
        toast({
          title: "Using cached data",
          description: "Couldn't connect to the server. Showing cached data.",
        });
        return true;
      }
      
      return false;
    }
  }, [
    db, isReady, buildQuery, pageSize, totalItems, 
    saveToCache, getFromCache, queryHash, transformDataFn,
    pageSnapshots, enablePerformanceTracking, toast
  ]);
  
  // Go to a specific page
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || (totalPages > 0 && page > totalPages) || page === currentPage) {
      return;
    }
    
    await loadPage(page);
  }, [loadPage, totalPages, currentPage]);
  
  // Go to next page
  const goToNextPage = useCallback(async () => {
    if (hasMore) {
      await goToPage(currentPage + 1);
    }
  }, [goToPage, currentPage, hasMore]);
  
  // Go to previous page
  const goToPreviousPage = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [goToPage, currentPage]);
  
  // Refresh current page
  const refresh = useCallback(async () => {
    clearCache();
    resetMetrics();
    await fetchPage(currentPage); 
  }, [clearCache, resetMetrics, fetchPage, currentPage]);
  
  // Load more items (for infinite scroll)
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await goToNextPage();
    }
  }, [goToNextPage, hasMore, isLoading]);
  
  // Reset pagination to first page
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setItems([]);
    setLastVisible(null);
    setPageSnapshots({});
    setHasMore(false);
    loadPage(1).catch(console.error);
  }, [loadPage]);
  
  // Initial data load
  useEffect(() => {
    if (isReady && db) {
      loadPage(currentPage).catch(err => {
        console.error("Error in initial page load:", err);
      });
    }
  }, [isReady, db]);
  
  // Generate performance metrics summaries
  const performance = useMemo(() => ({
    averageLoadTime: metrics.averageAccessTime,
    cacheHitRate: metrics.hitRate,
    memoryUsage: metrics.memoryUsage
  }), [metrics]);
  
  // Log performance metrics periodically in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enablePerformanceTracking) {
      const interval = setInterval(() => {
        logMetrics();
      }, 30000); // Log every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [enablePerformanceTracking, logMetrics]);
  
  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages || totalPages === 0,
    hasMore,
    isLoading,
    error,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refresh,
    loadMore,
    resetPagination,
    performance
  };
}
