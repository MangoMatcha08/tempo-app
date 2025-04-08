
import { useState, useCallback, useEffect, useMemo } from 'react';

// Interface for pagination options
export interface PaginationOptions<T> {
  collectionName: string;
  pageSize: number;
  orderByField: string;
  orderDirection: 'asc' | 'desc';
  whereConditions?: Array<[string, '==' | '!=' | '>' | '>=' | '<' | '<=', any]>;
  transformDataFn?: (doc: any) => T;
  cacheKey?: string;
  enablePerformanceTracking?: boolean;
}

// Generic pagination hook that can be used with any data type
export function usePagination<T>(options: PaginationOptions<T>) {
  const {
    collectionName,
    pageSize,
    orderByField,
    orderDirection,
    whereConditions = [],
    transformDataFn = (doc: any) => doc as T,
    cacheKey,
    enablePerformanceTracking = false
  } = options;
  
  // State for pagination
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Calculate total pages
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalItems / pageSize)),
  [totalItems, pageSize]);
  
  // Load a specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  // Load more items for infinite scrolling
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, loading]);
  
  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setItems([]);
  }, []);
  
  // Check for cache (mock implementation)
  const checkCache = useCallback(() => {
    if (!cacheKey) return null;
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error reading from cache:', error);
    }
    return null;
  }, [cacheKey]);
  
  // Save to cache (mock implementation)
  const saveToCache = useCallback((data: { items: T[], totalItems: number }) => {
    if (!cacheKey) return;
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [cacheKey]);
  
  // Fetch mock data for demonstration
  useEffect(() => {
    setLoading(true);
    
    // Try to get from cache first
    const cached = checkCache();
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      setItems(cached.items);
      setTotalItems(cached.totalItems);
      setHasMore(cached.items.length < cached.totalItems);
      setLoading(false);
      return;
    }
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Mock pagination logic that would normally be handled by Firestore
      const mockItems = Array(pageSize).fill(null).map((_, i) => ({
        id: `item-${currentPage}-${i}`,
        name: `Item ${currentPage * pageSize + i}`,
        timestamp: new Date()
      }));
      
      // Transform items if a transform function was provided
      const transformedItems = mockItems.map(item => transformDataFn(item));
      
      // Update state
      setItems(prev => currentPage === 1 ? transformedItems : [...prev, ...transformedItems]);
      setTotalItems(100); // Mock total
      setHasMore(currentPage * pageSize < 100);
      setLoading(false);
      
      // Save to cache
      if (currentPage === 1) {
        saveToCache({ items: transformedItems, totalItems: 100 });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, collectionName, orderByField, orderDirection, transformDataFn, checkCache, saveToCache]);
  
  return {
    items,
    isLoading: loading,
    currentPage,
    totalPages,
    totalItems,
    hasMore,
    goToPage,
    loadMore,
    resetPagination
  };
}
