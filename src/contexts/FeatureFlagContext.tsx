
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS, FEATURE_FLAGS_STORAGE_KEY } from '@/types/notifications/featureFlags';

interface FeatureFlagContextType {
  isFeatureEnabled: (featureName: string) => boolean;
  flags: Record<string, boolean>;
  // Adding missing properties
  devMode: boolean;
  toggleDevMode: () => void;
  setFlag: (flagName: keyof FeatureFlags, value: boolean) => void;
  resetFlags: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  isFeatureEnabled: () => false,
  flags: {},
  devMode: false,
  toggleDevMode: () => {},
  setFlag: () => {},
  resetFlags: () => {}
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
  // Load flags from local storage if available
  const loadFlags = useCallback(() => {
    if (typeof window === 'undefined') return { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
    try {
      const savedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      return savedFlags 
        ? { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(savedFlags), ...initialFlags }
        : { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
    } catch (e) {
      console.error('Error loading feature flags from storage', e);
      return { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
    }
  }, [initialFlags]);
  
  // Initialize flags state
  const [flags, setFlags] = useState<Record<string, boolean>>(loadFlags);
  
  // Check if a feature is enabled
  const isFeatureEnabled = useCallback((featureName: string): boolean => {
    return flags[featureName] || false;
  }, [flags]);
  
  // Setter for individual flag
  const setFlag = useCallback((flagName: keyof FeatureFlags, value: boolean) => {
    setFlags(prevFlags => {
      const newFlags = { ...prevFlags, [flagName]: value };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(newFlags));
        } catch (e) {
          console.error('Error saving feature flags to storage', e);
        }
      }
      return newFlags;
    });
  }, []);
  
  // Reset all flags to default
  const resetFlags = useCallback(() => {
    setFlags({ ...DEFAULT_FEATURE_FLAGS });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
      } catch (e) {
        console.error('Error removing feature flags from storage', e);
      }
    }
  }, []);
  
  // Toggle devMode specifically
  const devMode = flags.DEV_MODE || false;
  const toggleDevMode = useCallback(() => {
    setFlag('DEV_MODE', !devMode);
  }, [devMode, setFlag]);
  
  const value = {
    isFeatureEnabled,
    flags,
    devMode,
    toggleDevMode,
    setFlag,
    resetFlags
  };
  
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export default FeatureFlagContext;
