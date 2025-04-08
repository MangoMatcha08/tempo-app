
import { useMemo } from 'react';
import { usePagination, PaginationOptions } from '../usePagination';
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
  
  // Get page size from feature flags
  const notificationsPageSize = useFeature('NOTIFICATIONS_PAGE_SIZE') || 5;
  const pageSize = isMobile ? Math.min(notificationsPageSize, 3) : notificationsPageSize;
  
  // Extract options with defaults
  const {
    unreadOnly = false,
    orderBy = 'timestamp',
    orderDirection = 'desc'
  } = options;
  
  // Build whereConditions array for the query
  const whereConditions = useMemo(() => {
    const conditions: Array<[string, '==' | '!=' | '>' | '>=' | '<' | '<=', any]> = [];
    
    // Always filter by userId
    if (user?.uid) {
      conditions.push(['userId', '==', user.uid]);
    }
    
    // Filter by read status if unreadOnly is true
    if (unreadOnly) {
      conditions.push(['status', 'in', ['new', 'delivered']]);
    }
    
    return conditions;
  }, [user, unreadOnly]);
  
  // Transform Firestore document to NotificationRecord
  const transformNotificationDoc = (doc: DocumentData): NotificationRecord => {
    const data = doc.data();
    const id = doc.id;
    
    // Convert timestamp to Date
    const getDateValue = (value: any): Date => {
      if (!value) return new Date();
      if (value.toDate && typeof value.toDate === 'function') {
        return value.toDate();
      }
      return new Date(value);
    };
    
    return {
      id,
      title: data.title || '',
      body: data.body || '',
      status: data.status || 'new',
      type: data.type || 'info',
      priority: data.priority || 'normal',
      timestamp: getDateValue(data.timestamp),
      userId: data.userId,
      sourceId: data.sourceId || null,
      sourceType: data.sourceType || null,
      actions: data.actions || [],
      image: data.image || null,
      read: data.read || false,
      readAt: data.readAt ? getDateValue(data.readAt) : null,
      metadata: data.metadata || {}
    };
  };
  
  // Setup pagination config
  const paginationOptions: PaginationOptions<NotificationRecord> = {
    collectionName: 'notifications',
    pageSize,
    orderByField: orderBy,
    orderDirection,
    whereConditions,
    transformDataFn: transformNotificationDoc,
    cacheKey: `notifications-${user?.uid}-${unreadOnly}-${orderBy}-${orderDirection}`,
    enablePerformanceTracking: true
  };
  
  // Use the generic pagination hook
  return usePagination<NotificationRecord>(paginationOptions);
}
