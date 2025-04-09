
/**
 * Notification Features Hook
 * 
 * Provides feature flag functionality for notification subsystem
 */

import { useFeature } from "@/contexts/FeatureFlagContext";

/**
 * Check if notification features are enabled
 */
export function useNotificationFeatures() {
  // Use the feature flag context
  const { isFeatureEnabled: checkFeature } = useFeature();
  
  /**
   * Check if a notification feature is enabled
   * @param featureName Name of the feature
   */
  const isFeatureEnabled = (featureName: string): boolean => {
    // Default features that are always enabled
    const defaultFeatures = {
      "HISTORY_ENABLED": true,
      "PAGINATED_LOADING": false
    };
    
    // Check against context first, then fallback to defaults
    return checkFeature ? 
      checkFeature(featureName) : 
      defaultFeatures[featureName] || false;
  };
  
  return { isFeatureEnabled };
}

export default useNotificationFeatures;
