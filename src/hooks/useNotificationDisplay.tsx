
/**
 * @deprecated Use hooks from '@/hooks/notifications/useNotificationDisplay' instead
 * This file is maintained for backward compatibility.
 */

import { useState, useEffect } from 'react';
import { useNotificationHistory } from '@/contexts/notificationHistory';
import { NotificationRecord, NotificationAction } from '@/types/notifications';
import { useNotificationDisplay as useNotificationDisplayNew } from './notifications/useNotificationDisplay';
import { useFeature } from '@/contexts/FeatureFlagContext';

/**
 * @deprecated Use hooks from '@/hooks/notifications/useNotificationDisplay' instead
 * This hook is maintained for backward compatibility.
 */
export const useNotificationDisplay = (options: {
  limit?: number;
  filter?: (notification: NotificationRecord) => boolean;
} = {}) => {
  return useNotificationDisplayNew(options);
};

export default useNotificationDisplay;
