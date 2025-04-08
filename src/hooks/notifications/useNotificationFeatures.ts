
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
import { FeatureFlags } from '@/types/notifications/featureFlags';

/**
 * Check if a string is a valid feature flag key
 * @param key The string to check
 * @returns True if the key is a valid feature flag
 */
function isValidFeatureKey(key: string): key is keyof FeatureFlags {
  return key in NOTIFICATION_FEATURES;
}

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
    const contextValue = useFeature(featureName as keyof FeatureFlags);
    
    // Fall back to static flags
    if (typeof contextValue === 'boolean') {
      return contextValue;
    }
    
    // Check if the feature exists in NOTIFICATION_FEATURES
    if (isValidFeatureKey(featureName)) {
      return Boolean(NOTIFICATION_FEATURES[featureName]);
    }
    
    // Default to false for unknown features
    return false;
  }, [useFeature]);

  return { isFeatureEnabled };
}
