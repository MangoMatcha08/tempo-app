
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the feature flags interface
export interface FeatureFlags {
  VIRTUALIZED_LISTS: boolean;
  PAGINATED_LOADING: boolean;
  HISTORY_ENABLED: boolean;
  QUIET_HOURS: boolean;
  IOS_PUSH_NOTIFICATIONS: boolean;
  ENHANCED_SERVICE_WORKER: boolean;
  DEBUG_MODE: boolean;
  [key: string]: boolean;
}

// Default feature flags
const defaultFeatureFlags: FeatureFlags = {
  VIRTUALIZED_LISTS: true,
  PAGINATED_LOADING: true,
  HISTORY_ENABLED: true,
  QUIET_HOURS: false,
  IOS_PUSH_NOTIFICATIONS: true,
  ENHANCED_SERVICE_WORKER: false,
  DEBUG_MODE: process.env.NODE_ENV === 'development'
};

// Context for feature flags
interface FeatureFlagContextType {
  flags: FeatureFlags;
  setFeatureFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  resetFeatureFlags: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: defaultFeatureFlags,
  setFeatureFlag: () => {},
  resetFeatureFlags: () => {}
});

// Provider component
export const FeatureFlagProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFeatureFlags);

  // Load flags from localStorage on mount
  useEffect(() => {
    try {
      const storedFlags = localStorage.getItem('featureFlags');
      if (storedFlags) {
        setFlags(prev => ({
          ...prev,
          ...JSON.parse(storedFlags)
        }));
      }
    } catch (error) {
      console.error('Error loading feature flags from localStorage:', error);
    }
  }, []);

  // Update a specific feature flag
  const setFeatureFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => {
      const newFlags = { ...prev, [flag]: value };
      
      // Save to localStorage
      try {
        localStorage.setItem('featureFlags', JSON.stringify(newFlags));
      } catch (error) {
        console.error('Error saving feature flags to localStorage:', error);
      }
      
      return newFlags;
    });
  };

  // Reset all feature flags to their default values
  const resetFeatureFlags = () => {
    setFlags(defaultFeatureFlags);
    try {
      localStorage.setItem('featureFlags', JSON.stringify(defaultFeatureFlags));
    } catch (error) {
      console.error('Error saving feature flags to localStorage:', error);
    }
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, setFeatureFlag, resetFeatureFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Hook to use feature flags
export const useFeatureFlags = () => useContext(FeatureFlagContext);

// Simplified hook to check if a specific feature is enabled
export const useFeature = (featureName: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags[featureName] || false;
};

// Export for type usage
export type { FeatureFlags };
