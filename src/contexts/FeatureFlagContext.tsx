
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the feature flags available in the application
export interface FeatureFlags {
  // General features
  DEBUG_MODE: boolean;
  DEVELOPER_TOOLS: boolean;
  BETA_FEATURES: boolean;
  
  // Notification features
  PUSH_NOTIFICATIONS: boolean;
  EMAIL_NOTIFICATIONS: boolean;
  DAILY_SUMMARY: boolean;
  IN_APP_NOTIFICATIONS: boolean;
  BACKGROUND_SYNC: boolean;
  IOS_PUSH_NOTIFICATIONS: boolean;
  
  // Performance features
  VIRTUALIZED_LISTS: boolean;
  PAGINATED_LOADING: boolean;
  
  // Data management features
  AUTO_CLEANUP: boolean;
  HISTORY_ENABLED: boolean;
  
  // UI enhancements
  ENHANCED_REMINDER_EDITOR: boolean;
  VOICE_REMINDERS: boolean;
  CHECKLIST_ITEMS: boolean;
  
  // Any other feature flags
  [key: string]: boolean;
}

// Default feature flags
const defaultFlags: FeatureFlags = {
  DEBUG_MODE: false,
  DEVELOPER_TOOLS: false,
  BETA_FEATURES: false,
  
  PUSH_NOTIFICATIONS: true,
  EMAIL_NOTIFICATIONS: true,
  DAILY_SUMMARY: true,
  IN_APP_NOTIFICATIONS: true,
  BACKGROUND_SYNC: false,
  IOS_PUSH_NOTIFICATIONS: true,
  
  VIRTUALIZED_LISTS: true,
  PAGINATED_LOADING: true,
  
  AUTO_CLEANUP: true,
  HISTORY_ENABLED: true,
  
  ENHANCED_REMINDER_EDITOR: true,
  VOICE_REMINDERS: true,
  CHECKLIST_ITEMS: true,
};

// Interface for the context
export interface FeatureFlagContextType {
  flags: FeatureFlags;
  devMode: boolean;
  toggleDevMode: () => void;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  resetFlags: () => void;
}

// Create context with default values
const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: defaultFlags,
  devMode: false,
  toggleDevMode: () => {},
  setFlag: () => {},
  resetFlags: () => {},
});

// Store keys
const FEATURE_FLAGS_STORAGE_KEY = 'app_feature_flags';
const DEV_MODE_STORAGE_KEY = 'app_dev_mode';

// Provider component
export const FeatureFlagProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize from local storage or defaults
  const initializeFlags = () => {
    try {
      const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      return storedFlags ? { ...defaultFlags, ...JSON.parse(storedFlags) } : { ...defaultFlags };
    } catch (err) {
      console.error('Error loading feature flags from storage:', err);
      return { ...defaultFlags };
    }
  };
  
  const initializeDevMode = () => {
    try {
      return localStorage.getItem(DEV_MODE_STORAGE_KEY) === 'true';
    } catch (err) {
      return false;
    }
  };
  
  const [flags, setFlags] = useState<FeatureFlags>(initializeFlags);
  const [devMode, setDevMode] = useState<boolean>(initializeDevMode);
  
  // Save to localStorage when flags or devMode change
  useEffect(() => {
    try {
      localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));
    } catch (err) {
      console.error('Error saving feature flags to storage:', err);
    }
  }, [flags]);
  
  useEffect(() => {
    try {
      localStorage.setItem(DEV_MODE_STORAGE_KEY, devMode ? 'true' : 'false');
    } catch (err) {
      console.error('Error saving dev mode to storage:', err);
    }
  }, [devMode]);
  
  // Toggle developer mode
  const toggleDevMode = () => setDevMode(prev => !prev);
  
  // Set a specific flag
  const setFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prevFlags => ({
      ...prevFlags,
      [flag]: value
    }));
  };
  
  // Reset flags to defaults
  const resetFlags = () => {
    setFlags(defaultFlags);
  };
  
  return (
    <FeatureFlagContext.Provider value={{ flags, devMode, toggleDevMode, setFlag, resetFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Custom hook to use feature flags
export const useFeatureFlags = () => useContext(FeatureFlagContext);

// Helper hook to check a specific feature
export const useFeature = (featureName: keyof FeatureFlags): boolean => {
  const { flags } = useFeatureFlags();
  return flags[featureName] || false;
};

export default FeatureFlagContext;
