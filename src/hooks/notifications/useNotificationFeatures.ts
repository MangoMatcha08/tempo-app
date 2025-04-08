
/**
 * Notification Features Hook
 * 
 * Provides access to notification feature flags
 * 
 * @module hooks/notifications/useNotificationFeatures
 */

import { useCallback } from 'react';
import { useFeature } from '@/contexts/FeatureFlagContext';
import { NOTIFICATION_FEATURES } from '@/types/notifications';
import { NotificationFeatures } from './types';

/**
 * Hook for notification feature flags
 * 
 * @returns Feature flag methods
 */
export function useNotificationFeatures(): NotificationFeatures {
  /**
   * Check if a notification feature is enabled
   * @param featureName The name of the feature to check
   * @returns True if the feature is enabled
   */
  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    // Check context first for dynamic flags
    const contextValue = useFeature(featureName);
    
    // Fall back to static flags
    if (typeof contextValue === 'boolean') {
      return contextValue;
    }
    
    // Check if the feature exists in NOTIFICATION_FEATURES
    return Boolean(NOTIFICATION_FEATURES[featureName as keyof typeof NOTIFICATION_FEATURES]);
  }, [useFeature]);

  return { isFeatureEnabled };
}
