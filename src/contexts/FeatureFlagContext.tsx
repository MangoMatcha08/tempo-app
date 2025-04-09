
import React, { createContext, useContext } from 'react';

interface FeatureFlagContextType {
  isFeatureEnabled: (featureName: string) => boolean;
  flags: Record<string, boolean>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  isFeatureEnabled: () => false,
  flags: {}
});

export const useFeature = () => useContext(FeatureFlagContext);

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  return context;
};

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  initialFlags?: Record<string, boolean>;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ 
  children, 
  initialFlags = {} 
}) => {
  // Start with default notification-related flags
  const defaultFlags = {
    "ADVANCED_CACHE": false,
    "AUTO_CLEANUP": false,
    "HISTORY_ENABLED": true,
    "PAGINATED_LOADING": false
  };
  
  // Combine default flags with provided ones
  const flags = { ...defaultFlags, ...initialFlags };
  
  const isFeatureEnabled = (featureName: string): boolean => {
    return flags[featureName] || false;
  };
  
  const value = {
    isFeatureEnabled,
    flags
  };
  
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export default FeatureFlagContext;
