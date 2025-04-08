
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureFlags, DEFAULT_FEATURE_FLAGS, FEATURE_FLAGS_STORAGE_KEY } from '@/types/notifications/featureFlags';

// Context interface for feature flags
interface FeatureFlagContextType {
  flags: FeatureFlags;
  setFlag: (flagName: keyof FeatureFlags, value: boolean) => void;
  resetFlags: () => void;
  devMode: boolean;
  toggleDevMode: () => void;
}

// Create the context with default values
const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: DEFAULT_FEATURE_FLAGS,
  setFlag: () => {},
  resetFlags: () => {},
  devMode: false,
  toggleDevMode: () => {}
});

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ 
  children, 
  initialFlags = {} 
}) => {
  // Load flags from localStorage or use defaults
  const loadPersistedFlags = (): FeatureFlags => {
    if (typeof window === 'undefined') return { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
    
    try {
      const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags);
        return { ...DEFAULT_FEATURE_FLAGS, ...parsedFlags, ...initialFlags };
      }
    } catch (error) {
      console.error('Error loading feature flags from storage:', error);
    }
    
    return { ...DEFAULT_FEATURE_FLAGS, ...initialFlags };
  };
  
  const [flags, setFlags] = useState<FeatureFlags>(loadPersistedFlags());
  const [devMode, setDevMode] = useState<boolean>(flags.DEV_MODE || false);
  
  // Persist flags to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));
    }
  }, [flags]);
  
  // Update a single flag
  const setFlag = (flagName: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => {
      const newFlags = { ...prev, [flagName]: value };
      
      // If we're disabling DEV_MODE, update the state
      if (flagName === 'DEV_MODE') {
        setDevMode(value);
      }
      
      return newFlags;
    });
  };
  
  // Reset all flags to default values
  const resetFlags = () => {
    setFlags(DEFAULT_FEATURE_FLAGS);
    setDevMode(DEFAULT_FEATURE_FLAGS.DEV_MODE);
  };
  
  // Toggle developer mode
  const toggleDevMode = () => {
    setDevMode(prev => {
      const newValue = !prev;
      setFlag('DEV_MODE', newValue);
      return newValue;
    });
  };
  
  return (
    <FeatureFlagContext.Provider 
      value={{ 
        flags, 
        setFlag, 
        resetFlags,
        devMode,
        toggleDevMode
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Custom hook to use feature flags
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  
  return context;
};

// Hook to check if a specific feature is enabled
export const useFeature = (featureName: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags[featureName];
};
