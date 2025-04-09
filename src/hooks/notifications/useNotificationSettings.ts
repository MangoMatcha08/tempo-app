
import { useState, useEffect, useCallback } from 'react';
import { getUserNotificationSettings, updateUserNotificationSettings } from '@/services/notificationService';
import { NotificationSettings } from '@/types/notifications/settingsTypes';

/**
 * Hook for managing notification settings
 */
export function useNotificationSettings(userId: string = 'anonymous') {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    push: {
      enabled: true,
      minPriority: 'low'
    },
    email: {
      enabled: false,
      address: '',
      minPriority: 'medium',
      dailySummary: {
        enabled: false,
        timing: 'before'
      }
    },
    inApp: {
      enabled: true,
      minPriority: 'low'
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {
      reminders: true,
      system: true,
      marketing: false
    },
    frequency: 'immediate',
    grouping: 'none',
    sms: false
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userSettings = await getUserNotificationSettings(userId);
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        console.error('Error loading notification settings:', err);
        setError(err instanceof Error ? err : new Error('Failed to load notification settings'));
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [userId]);
  
  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!userId) return false;
    
    try {
      setLoading(true);
      const updatedSettings = { ...settings, ...newSettings };
      await updateUserNotificationSettings(userId, updatedSettings);
      setSettings(updatedSettings);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to update notification settings'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, settings]);
  
  return {
    settings,
    updateSettings,
    loading,
    error
  };
}

export default useNotificationSettings;
