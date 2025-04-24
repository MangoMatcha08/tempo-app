
/**
 * Notification Delivery Hook
 * 
 * This hook combines the notification service, platform adapter, and strategy pattern
 * to provide a unified interface for sending notifications.
 */

import { useState, useCallback } from 'react';
import { NotificationRecord, NotificationDeliveryStatus } from '@/types/notifications';
import { notificationDelivery } from '@/strategies/notification/NotificationStrategy';
import { notificationService, useNotificationService } from '@/services/notification/NotificationService';
import { getPlatformAdapter } from '@/adapters/platform/PlatformAdapter';
import { NotificationMethod } from '@/utils/notificationCapabilities';
import { Reminder, NotificationType } from '@/types/reminderTypes';
import { formatReminderForNotification } from '@/utils/notificationUtils';
import { useToast } from '@/hooks/use-toast';

// Results interface
export interface DeliveryAttempt {
  notification: NotificationRecord;
  success: boolean;
  method: NotificationMethod;
  error?: Error;
  timestamp: number;
}

export function useNotificationDelivery() {
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDelivery, setLastDelivery] = useState<DeliveryAttempt | null>(null);
  const { toast } = useToast();
  
  const notificationSvc = useNotificationService();
  
  const deliverNotification = useCallback(async (
    notification: NotificationRecord
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Use the notification service to send the notification
      const result = await notificationSvc.sendNotification(notification);
      
      // Create a record of the delivery attempt
      const attempt: DeliveryAttempt = {
        notification,
        success: result,
        method: notificationDelivery.getBestAvailableMethod(),
        timestamp: Date.now()
      };
      
      setDeliveryHistory(prev => [attempt, ...prev]);
      setLastDelivery(attempt);
      
      return result;
    } catch (error) {
      console.error('Error delivering notification:', error);
      
      // Record the failed attempt
      const attempt: DeliveryAttempt = {
        notification,
        success: false,
        method: notificationDelivery.getBestAvailableMethod(),
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };
      
      setDeliveryHistory(prev => [attempt, ...prev]);
      setLastDelivery(attempt);
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [notificationSvc]);
  
  const deliverReminderNotification = useCallback(async (
    reminder: Reminder
  ): Promise<boolean> => {
    const notificationData = formatReminderForNotification(reminder);
    
    if (!notificationData) {
      console.error('Could not format reminder for notification', reminder);
      return false;
    }
    
    const notification: NotificationRecord = {
      id: `reminder-${reminder.id}-${Date.now()}`,
      title: notificationData.title,
      body: notificationData.description || '',
      timestamp: Date.now(),
      type: NotificationType.TEST, // Default to test notification type
      reminderId: reminder.id,
      priority: reminder.priority,
      status: NotificationDeliveryStatus.PENDING, // Changed from string literal to enum
      channels: []
    };
    
    const success = await deliverNotification(notification);
    
    if (success) {
      toast({
        title: notification.title,
        description: notification.body,
        duration: 5000,
      });
    }
    
    return success;
  }, [deliverNotification, toast]);
  
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      return await notificationService.requestPermission();
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }, []);
  
  const getBestMethod = useCallback((): NotificationMethod => {
    return notificationDelivery.getBestAvailableMethod();
  }, []);
  
  const isPermissionGranted = useCallback((): boolean => {
    return notificationService.isPermissionGranted();
  }, []);
  
  const getPlatformInfo = useCallback(() => {
    return getPlatformAdapter().getPlatformInfo();
  }, []);
  
  return {
    deliverNotification,
    deliverReminderNotification,
    requestPermission,
    isPermissionGranted,
    getBestMethod,
    getPlatformInfo,
    deliveryHistory,
    lastDelivery,
    loading
  };
}
