
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFeature } from '@/contexts/FeatureFlagContext';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { DocumentData } from 'firebase/firestore';

interface NotificationPaginationOptions {
  unreadOnly?: boolean;
  orderBy?: 'timestamp' | 'priority';
  orderDirection?: 'asc' | 'desc';
}

export function useNotificationPagination(options: NotificationPaginationOptions = {}) {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Get page size from feature flags - now correctly typed
  const pageSize = useFeature('NOTIFICATIONS_PAGE_SIZE');
  const mobilePageSize = isMobile ? Math.min(pageSize, 3) : pageSize;
  
  // Extract options with defaults
  const {
    unreadOnly = false,
    orderBy = 'timestamp',
    orderDirection = 'desc'
  } = options;
  
  // State for pagination
  const [items, setItems] = useState<NotificationRecord[]>([]);
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
    
    // Filter by read status if unreadOnly is true
    if (unreadOnly) {
      conditions.push(['status', '==', 'new']); // Using '==' instead of 'in'
    }
    
    return conditions;
  }, [user, unreadOnly]);
  
  // Calculate total pages
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalItems / mobilePageSize)),
  [totalItems, mobilePageSize]);
  
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
  
  // Mock function to simulate loading notifications
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Sample notification data with numeric timestamp (not Date object)
      const mockData: NotificationRecord[] = Array(mobilePageSize).fill(null).map((_, i) => ({
        id: `notification-${currentPage}-${i}`,
        title: `Notification ${currentPage * mobilePageSize + i}`,
        body: `This is a sample notification with details ${currentPage * mobilePageSize + i}`,
        status: unreadOnly ? 'new' : (Math.random() > 0.5 ? 'new' : 'read'),
        type: ['default', 'success', 'info', 'warning', 'error'][Math.floor(Math.random() * 5)] as any,
        priority: 'normal',
        timestamp: Date.now() - (i * 60000), // Numeric timestamp (milliseconds)
        userId: user?.uid || 'unknown',
        sourceId: null,
        sourceType: null,
        actions: [],
        image: null,
        read: !unreadOnly && Math.random() > 0.5,
        readAt: null,
        metadata: {},
        channels: ['in-app'] // Added required channels property
      }));
      
      setItems(prev => currentPage === 1 ? mockData : [...prev, ...mockData]);
      setTotalItems(100); // Mock total
      setHasMore(currentPage < 10); // Mock 10 pages total
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentPage, mobilePageSize, unreadOnly, user?.uid]);
  
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
