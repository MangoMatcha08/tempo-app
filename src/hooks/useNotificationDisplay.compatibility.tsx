
/**
 * Compatibility layer for the legacy useNotificationDisplay hook
 * 
 * This file maintains backward compatibility with the old hook pattern
 * while encouraging migration to the new hooks.
 * 
 * @deprecated Use hooks from '@/hooks/notifications' instead
 * @module hooks/useNotificationDisplay.compatibility
 */

import { useNotificationDisplay } from './notifications/useNotificationDisplay';

/**
 * Legacy notification display hook
 * 
 * @deprecated Use hooks from '@/hooks/notifications' instead
 * @param options Display options like limit and filters
 * @returns Backward-compatible hook API
 */
export const useNotificationDisplay_DEPRECATED = (options = {}) => {
  console.warn(
    '[DEPRECATED] useNotificationDisplay from @/hooks/useNotificationDisplay.tsx is deprecated. ' +
    'Please use the new hook from @/hooks/notifications/useNotificationDisplay.ts instead.'
  );
  
  // Use the new implementation but return the old API structure
  return useNotificationDisplay(options);
};

/**
 * Re-export the new hook as the default
 * This allows existing code to gradually migrate
 */
export const useNotificationDisplay_CURRENT = useNotificationDisplay;
export default useNotificationDisplay;
