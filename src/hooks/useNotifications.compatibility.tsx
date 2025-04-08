
/**
 * Compatibility layer for the legacy useNotifications hook
 * 
 * This file maintains backward compatibility with the old hook pattern
 * while encouraging migration to the new hooks.
 * 
 * @deprecated Use hooks from '@/hooks/notifications' instead
 * @module hooks/useNotifications.compatibility
 */

import { useNotifications } from './notifications/useNotifications';
import { useNotificationHistory } from '@/contexts/notificationHistory';

/**
 * Legacy notifications hook
 * 
 * @deprecated Use hooks from '@/hooks/notifications' instead
 * @returns Backward-compatible hook API
 */
export const useNotifications_DEPRECATED = () => {
  console.warn(
    '[DEPRECATED] useNotifications from @/hooks/useNotifications.tsx is deprecated. ' +
    'Please use the new hooks from @/hooks/notifications/useNotifications.ts instead.'
  );
  
  const newHook = useNotifications();
  
  // Format the API to match the old hook
  return {
    showNotification: newHook.showNotification,
    handleServiceWorkerMessage: newHook.handleServiceWorkerMessage,
    showToastNotification: newHook.showToastNotification,
    ...useNotificationHistory()
  };
};

/**
 * Re-export the new hook as the default
 * This allows existing code to gradually migrate
 */
export const useNotifications_CURRENT = useNotifications;
export default useNotifications;
