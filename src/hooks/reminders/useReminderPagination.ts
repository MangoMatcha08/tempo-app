
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/contexts/FirestoreContext';
import { UIReminder, ReminderCategory, ReminderPriority } from '@/types/reminderTypes';
import { useFeature } from '@/contexts/FeatureFlagContext';
import { useMediaQuery } from '@/hooks/use-media-query';

// Options specifically for reminder pagination
interface ReminderPaginationOptions {
  filterCompleted?: boolean | null; // null = show all, true = only completed, false = only incomplete
  filterPriority?: string | null;
  orderBy?: 'dueDate' | 'createdAt' | 'priority';
  orderDirection?: 'asc' | 'desc';
  enablePerformanceTracking?: boolean;
}

export function useReminderPagination(options: ReminderPaginationOptions = {}) {
  const { user } = useAuth();
  const { isReady, useMockData } = useFirestore();
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Get page size from feature flags or use default based on device
  const smallPageSize = useFeature('SMALL_PAGE_SIZE') ? 5 : 5; // Default to 5
  const largePageSize = useFeature('LARGE_PAGE_SIZE') ? 10 : 10; // Default to 10
  const pageSize = isMobile ? smallPageSize : largePageSize;
  
  // Extract options with defaults
  const {
    filterCompleted = null,
    filterPriority = null,
    orderBy = 'dueDate',
    orderDirection = 'asc',
    enablePerformanceTracking = true
  } = options;
  
  // State for pagination
  const [items, setItems] = useState<UIReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Build whereConditions array for the query
  const whereConditions = useMemo(() => {
    const conditions: Array<[string, '==' | '!=' | '>' | '>=' | '<' | '<=', any]> = [];
    
    // Always filter by userId
    if (user?.uid) {
      conditions.push(['userId', '==', user.uid]);
    }
    
    // Filter by completion status if specified
    if (filterCompleted !== null) {
      conditions.push(['completed', '==', filterCompleted]);
    }
    
    // Filter by priority if specified
    if (filterPriority) {
      conditions.push(['priority', '==', filterPriority]);
    }
    
    return conditions;
  }, [user, filterCompleted, filterPriority]);
  
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
  
  // Load more items
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
  
  // For development/demo mode, generate mock reminders if useMockData is true
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      let mockItems: UIReminder[];
      
      if (useMockData || !isReady) {
        // Generate mock reminders for demo purposes
        mockItems = Array(pageSize).fill(0).map((_, i) => ({
          id: `mock-${currentPage}-${i}`,
          title: `Mock Reminder ${currentPage * pageSize + i + 1}`,
          description: 'This is a mock reminder for demonstration purposes.',
          dueDate: new Date(Date.now() + (i * 86400000)), // Each one due a day later
          priority: [ReminderPriority.HIGH, ReminderPriority.MEDIUM, ReminderPriority.LOW][i % 3],
          completed: i % 4 === 0,
          completedAt: i % 4 === 0 ? new Date() : undefined,
          category: Object.values(ReminderCategory)[i % Object.values(ReminderCategory).length],
          userId: user?.uid || 'mock-user',
          tags: []
        }));
      } else {
        // This would be where you'd fetch from Firestore
        mockItems = [];
      }
      
      setItems(prev => currentPage === 1 ? mockItems : [...prev, ...mockItems]);
      setTotalItems(50); // Mock total
      setHasMore(currentPage < Math.ceil(50 / pageSize)); // Set has more based on total
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, useMockData, isReady, user?.uid]);
  
  return {
    items,
    isLoading: loading,
    currentPage,
    totalPages,
    totalItems,
    hasMore,
    goToPage,
    loadMore,
    resetPagination,
    pageSize
  };
}
