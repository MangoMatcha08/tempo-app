
/**
 * @deprecated Use hooks from '@/hooks/notifications/useNotifications' instead
 * This file is maintained for backward compatibility.
 */

import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext';
import { useNotificationPermission } from '@/contexts/NotificationPermissionContext';
import { useNotificationDisplay } from '@/hooks/useNotificationDisplay';
import { toast } from 'sonner';
import { 
  NotificationRecord, 
  NotificationDeliveryStatus,
  NotificationAction,
  NotificationSettings,
  PermissionRequestResult,
  ServiceWorkerMessage
} from '@/types/notifications';
import { Reminder } from '@/types/reminderTypes';
import { sendTestNotification } from '@/services/notificationService';
import { useNotifications as useNotificationsNew } from './notifications/useNotifications';

/**
 * @deprecated Use hooks from '@/hooks/notifications/useNotifications' instead
 * This hook is maintained for backward compatibility.
 */
export function useNotificationHandler() {
  return useNotificationsNew();
}

export default useNotificationHandler;
