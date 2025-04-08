
/**
 * Notification Permission Hook
 * 
 * Provides access to notification permission state and methods
 * 
 * @module hooks/notifications/useNotificationPermission
 */

import { useCallback } from 'react';
import { 
  useNotificationPermission as usePermissionContext
} from '@/contexts/NotificationPermissionContext';
import { NotificationPermission } from './types';

/**
 * Hook for notification permission management
 * 
 * @returns Permission state and methods
 */
export function useNotificationPermission(): NotificationPermission {
  const context = usePermissionContext();
  
  // Forward methods from context with appropriate typing
  return {
    permissionGranted: context.permissionGranted,
    isSupported: context.isSupported,
    requestPermission: context.requestPermission
  };
}
