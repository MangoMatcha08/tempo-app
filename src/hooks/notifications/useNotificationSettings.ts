
/**
 * Notification Settings Hook
 * 
 * Provides access to notification settings and methods to update them
 * 
 * @module hooks/notifications/useNotificationSettings
 */

import { useCallback } from 'react';
import { 
  useNotificationSettings as useSettingsContext
} from '@/contexts/NotificationSettingsContext';
import { NotificationSettingsManagement } from './types';

/**
 * Hook for notification settings management
 * 
 * @returns Settings state and methods
 */
export function useNotificationSettings(): NotificationSettingsManagement {
  const context = useSettingsContext();
  
  // Forward methods from context with appropriate typing
  return {
    settings: context.settings,
    updateSettings: context.updateSettings,
    resetToDefaults: context.resetToDefaults
  };
}
