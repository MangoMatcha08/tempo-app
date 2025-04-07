
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  NotificationSettings, 
  defaultNotificationSettings 
} from '@/types/notifications/settingsTypes';
import { 
  getUserNotificationSettings, 
  updateUserNotificationSettings 
} from '@/services/notificationService';

interface NotificationSettingsContextType {
  settings: NotificationSettings;
  loading: boolean;
  error: Error | null;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType>({
  settings: defaultNotificationSettings,
  loading: false,
  error: null,
  updateSettings: async () => {},
  resetToDefaults: async () => {}
});

export const useNotificationSettings = () => useContext(NotificationSettingsContext);

interface NotificationSettingsProviderProps {
  children: React.ReactNode;
}

export const NotificationSettingsProvider: React.FC<NotificationSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from local storage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  // Initialize notification settings
  useEffect(() => {
    const initializeSettings = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userSettings = await getUserNotificationSettings(userId);
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load notification settings'));
        console.error('Error loading notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      initializeSettings();
    }
  }, [userId]);

  // Update settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!userId) {
      setError(new Error('No user ID available'));
      return;
    }

    try {
      setLoading(true);
      
      // Merge with current settings
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      
      // Save to backend
      await updateUserNotificationSettings(userId, updatedSettings);
      
      // Update local state
      setSettings(updatedSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update notification settings'));
      console.error('Error updating notification settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      await updateSettings(defaultNotificationSettings);
    } catch (err) {
      console.error('Error resetting notification settings:', err);
      throw err;
    }
  };

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    resetToDefaults
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};
