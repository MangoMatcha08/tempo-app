
import { useState, useEffect, useCallback } from 'react';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { ReminderPriority } from '@/types/reminderTypes';
import { NotificationType } from '@/types/reminderTypes';
import { NotificationDeliveryStatus } from '@/types/notifications/notificationHistoryTypes';
import { NotificationChannel } from '@/types/notifications/settingsTypes';

const PAGE_SIZE = 10;

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: NotificationRecord[];
  loading: boolean;
  hasMore: boolean;
}

const defaultPaginationState: PaginationState = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  items: [],
  loading: false,
  hasMore: false
};

interface UseNotificationPaginationOptions {
  initialPage?: number;
  pageSize?: number;
  fetchNotifications?: (page: number, pageSize: number) => Promise<{
    notifications: NotificationRecord[];
    totalCount: number;
  }>;
  useMockData?: boolean;
}

/**
 * Hook to handle notification pagination
 */
export const useNotificationPagination = ({
  initialPage = 1,
  pageSize = PAGE_SIZE,
  fetchNotifications,
  useMockData = false
}: UseNotificationPaginationOptions) => {
  const [state, setState] = useState<PaginationState>({
    ...defaultPaginationState,
    currentPage: initialPage,
    loading: true
  });
  
  const loadPage = useCallback(async (page: number) => {
    if (page < 1) {
      return false;
    }
    
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      if (useMockData) {
        // Use mock data if requested
        const mockData = generateMockNotifications(20);
        const startIndex = (page - 1) * pageSize;
        const pageItems = mockData.slice(startIndex, startIndex + pageSize);
        const totalCount = mockData.length;
        
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        const hasMore = page < totalPages;
        
        setState({
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          items: pageItems,
          loading: false,
          hasMore
        });
        
        return true;
      } 
      else if (fetchNotifications) {
        // Use provided fetch function
        const result = await fetchNotifications(page, pageSize);
        const totalPages = Math.max(1, Math.ceil(result.totalCount / pageSize));
        const hasMore = page < totalPages;
        
        setState({
          currentPage: page,
          totalPages,
          totalItems: result.totalCount,
          items: result.notifications,
          loading: false,
          hasMore
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error loading notifications page', error);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [pageSize, fetchNotifications, useMockData]);
  
  const setPage = useCallback((page: number) => {
    if (state.loading || page === state.currentPage || page < 1 || page > state.totalPages) {
      return;
    }
    loadPage(page);
  }, [state.loading, state.currentPage, state.totalPages, loadPage]);
  
  // Load initial page
  useEffect(() => {
    loadPage(initialPage);
  }, [initialPage, loadPage]);
  
  return {
    ...state,
    setPage,
    refreshCurrentPage: () => loadPage(state.currentPage),
    nextPage: () => setPage(state.currentPage + 1),
    prevPage: () => setPage(state.currentPage - 1)
  };
};

// Helper function to generate mock notifications for testing
function generateMockNotifications(count: number): NotificationRecord[] {
  const notifications: NotificationRecord[] = [];
  
  const types = ['reminder', 'system', 'message'];
  const priorities: ReminderPriority[] = [ReminderPriority.LOW, ReminderPriority.MEDIUM, ReminderPriority.HIGH];
  const statuses: NotificationDeliveryStatus[] = [NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.RECEIVED];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length] as NotificationType;
    const priority = priorities[i % priorities.length];
    const status = i % 3 === 0 ? NotificationDeliveryStatus.PENDING : NotificationDeliveryStatus.RECEIVED;
    
    notifications.push({
      id: `notification-${i + 1}`,
      title: `Notification ${i + 1}`,
      body: `This is the content of notification ${i + 1}`,
      status,
      type,
      priority,
      timestamp: Date.now() - (i * 3600000), // Hours ago
      userId: 'test-user',
      sourceId: type === 'reminder' ? `reminder-${i}` : null,
      sourceType: type,
      actions: [],
      image: null,
      read: status === NotificationDeliveryStatus.RECEIVED,
      readAt: status === NotificationDeliveryStatus.RECEIVED ? Date.now() - (i * 1000000) : null,
      metadata: {},
      channels: [NotificationChannel.IN_APP]
    });
  }
  
  return notifications;
}

export default useNotificationPagination;
