
/**
 * Compatibility layer for the legacy useNotificationHandler hook
 * 
 * This file maintains backward compatibility with the old hook pattern
 * while encouraging migration to the new hooks.
 * 
 * @deprecated Use hooks from '@/hooks/notifications' instead
 * @module hooks/useNotificationHandler.compatibility
 */

import { useNotifications } from './notifications/useNotifications';

/**
 * Legacy notification handler hook
 * 
 * @deprecated Use hooks from '@/hooks/notifications' instead
 * @returns Backward-compatible hook API
 */
export const useNotificationHandler_DEPRECATED = () => {
  console.warn(
    '[DEPRECATED] useNotificationHandler from @/hooks/useNotificationHandler.ts is deprecated. ' +
    'Please use the new hooks from @/hooks/notifications/useNotifications.ts instead.'
  );
  
  // Use the new implementation but format response to match the old API
  return useNotifications();
};

/**
 * Re-export the new hook as the default
 * This allows existing code to gradually migrate
 */
export const useNotificationHandler_CURRENT = useNotifications;
export default useNotifications;
