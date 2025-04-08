
import { useMemo } from 'react';
import { usePagination, PaginationOptions } from '../usePagination';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/contexts/FirestoreContext';
import { UIReminder } from '@/types/reminderTypes';
import { useFeature } from '@/contexts/FeatureFlagContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DocumentData } from 'firebase/firestore';

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
  const smallPageSize = useFeature('SMALL_PAGE_SIZE') || 5;
  const largePageSize = useFeature('LARGE_PAGE_SIZE') || 10;
  const pageSize = isMobile ? smallPageSize : largePageSize;
  
  // Extract options with defaults
  const {
    filterCompleted = null,
    filterPriority = null,
    orderBy = 'dueDate',
    orderDirection = 'asc',
    enablePerformanceTracking = true
  } = options;
  
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
  
  // Transform Firestore document to UIReminder
  const transformReminderDoc = (doc: DocumentData): UIReminder => {
    const data = doc.data();
    const id = doc.id;
    
    // Check if this is a timestamp and convert to Date
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
      description: data.description || '',
      dueDate: getDateValue(data.dueDate),
      priority: data.priority || 'medium',
      completed: data.completed || false,
      completedAt: data.completedAt ? getDateValue(data.completedAt) : undefined,
      createdAt: getDateValue(data.createdAt),
      category: data.category || 'general',
      userId: data.userId,
      tags: data.tags || []
    };
  };
  
  // Setup pagination config for reminders
  const paginationOptions: PaginationOptions<UIReminder> = {
    collectionName: 'reminders',
    pageSize,
    orderByField: orderBy,
    orderDirection,
    whereConditions,
    transformDataFn: transformReminderDoc,
    cacheKey: `reminders-${user?.uid}-${filterCompleted}-${filterPriority}-${orderBy}-${orderDirection}`,
    enablePerformanceTracking
  };
  
  // Use our generic pagination hook with reminder-specific options
  const pagination = usePagination<UIReminder>(paginationOptions);
  
  // For development/demo mode, generate mock reminders if useMockData is true
  const { items: paginatedItems, ...paginationProps } = pagination;
  const items = useMemo(() => {
    if (useMockData && !isReady) {
      // Generate mock reminders for demo purposes
      return Array(pageSize).fill(0).map((_, i) => ({
        id: `mock-${i}`,
        title: `Mock Reminder ${i + 1}`,
        description: 'This is a mock reminder for demonstration purposes.',
        dueDate: new Date(Date.now() + (i * 86400000)), // Each one due a day later
        priority: ['high', 'medium', 'low'][i % 3],
        completed: i % 4 === 0,
        createdAt: new Date(Date.now() - (i * 86400000)),
        category: 'general',
        userId: user?.uid || 'mock-user',
        tags: []
      } as UIReminder));
    }
    return paginatedItems;
  }, [paginatedItems, useMockData, isReady, pageSize, user?.uid]);
  
  return {
    ...paginationProps,
    items,
    pageSize
  };
}
