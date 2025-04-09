
import { useState, useCallback } from 'react';
import { sendTestNotification } from '@/services/messaging/messagingService';
import { NotificationCleanupConfig, CleanupResult } from './types';

/**
 * Hook for notification administrative services and utilities
 */
export function useNotificationServices() {
  // Define default cleanup configuration
  const defaultCleanupConfig: NotificationCleanupConfig = {
    enabled: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    maxCount: 100,
    keepImportant: true
  };
  
  // State for cleanup configuration
  const [cleanupConfig, setCleanupConfig] = useState<NotificationCleanupConfig>(defaultCleanupConfig);
  
  // Update cleanup configuration
  const updateCleanupConfig = useCallback((config: Partial<NotificationCleanupConfig>) => {
    setCleanupConfig(prev => ({
      ...prev,
      ...config
    }));
  }, []);
  
  // Clean up notifications based on config
  const cleanupNotifications = useCallback(async (
    options?: {
      maxAge?: number;
      maxCount?: number;
      keepHighPriority?: boolean;
      highPriorityMaxAge?: number;
    }
  ): Promise<CleanupResult> => {
    // Use provided options or fall back to config values
    const maxAge = options?.maxAge ?? cleanupConfig.maxAge;
    const maxCount = options?.maxCount ?? cleanupConfig.maxCount;
    const keepHighPriority = options?.keepHighPriority ?? cleanupConfig.keepImportant;
    
    console.log(`Cleaning up notifications: maxAge=${maxAge}ms, maxCount=${maxCount}, keepHighPriority=${keepHighPriority}`);
    
    // In a real implementation, this would delete old notifications from storage
    
    // Return mock result
    return {
      totalRemoved: 5,
      byAge: 3,
      byCount: 2
    };
  }, [cleanupConfig]);
  
  // Automatically run cleanup based on config
  const runAutomaticCleanup = useCallback(async (): Promise<void> => {
    if (!cleanupConfig.enabled) {
      console.log('Automatic cleanup disabled');
      return;
    }
    
    try {
      const result = await cleanupNotifications();
      console.log(`Automatic cleanup complete: removed ${result.totalRemoved} notifications`);
    } catch (error) {
      console.error('Error during automatic cleanup:', error);
    }
  }, [cleanupConfig.enabled, cleanupNotifications]);
  
  // Send test notification
  const sendTest = useCallback(async (options: { 
    type: "push" | "email"; 
    email?: string; 
    includeDeviceInfo?: boolean 
  }) => {
    try {
      const result = await sendTestNotification(options);
      return { success: result, error: null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, []);
  
  return {
    cleanupConfig,
    updateCleanupConfig,
    cleanupNotifications,
    runAutomaticCleanup,
    sendTestNotification: sendTest
  };
}
