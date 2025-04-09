
/**
 * Notification Delivery Hook
 * 
 * Manages the delivery of notifications through various channels
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NotificationDeliveryManager, NotificationDeliveryResult } from '@/types/notifications/sharedTypes';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { useNotificationServices } from './useNotificationServices';
import { useNotificationFeatures } from './useNotificationFeatures';
import { useNotificationPermission } from './useNotificationPermission';

/**
 * Extended interface for NotificationDeliveryManager to include missing methods
 */
interface ExtendedNotificationDeliveryManager extends NotificationDeliveryManager {
  getBestAvailableMethod: (notification: NotificationRecord) => string;
}

/**
 * Hook to manage notification delivery
 * 
 * @returns Notification delivery methods and state
 */
export function useNotificationDelivery() {
  const { deliveryManager, services } = useNotificationServices();
  const { isFeatureEnabled } = useNotificationFeatures();
  const { hasPermission } = useNotificationPermission();
  
  const [delivering, setDelivering] = useState(false);
  const [lastResult, setLastResult] = useState<NotificationDeliveryResult | null>(null);
  
  const extendedManager = deliveryManager as ExtendedNotificationDeliveryManager;
  
  /**
   * Deliver a notification using the best available channel
   */
  const deliverNotification = useCallback(async (notification: NotificationRecord): Promise<NotificationDeliveryResult> => {
    setDelivering(true);
    
    try {
      const channel = extendedManager.getBestAvailableMethod(notification);
      const result = await deliveryManager.deliver(notification, channel);
      
      setLastResult(result);
      return result;
    } catch (error) {
      const errorResult: NotificationDeliveryResult = {
        success: false,
        id: notification.id,
        channel: 'unknown',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setDelivering(false);
    }
  }, [deliveryManager, extendedManager]);
  
  /**
   * Get available delivery channels based on permissions and device capabilities
   */
  const availableChannels = useMemo(() => {
    const channels = [];
    
    // Push notifications
    if (hasPermission('notifications')) {
      channels.push('push');
    }
    
    // In-app notifications always available
    channels.push('in-app');
    
    // Email if enabled in settings
    if (isFeatureEnabled('EMAIL_NOTIFICATIONS')) {
      channels.push('email');
    }
    
    // SMS if enabled in settings
    if (isFeatureEnabled('SMS_NOTIFICATIONS')) {
      channels.push('sms');
    }
    
    return channels;
  }, [hasPermission, isFeatureEnabled]);
  
  /**
   * Check if a specific notification delivery method is available
   */
  const isDeliveryMethodAvailable = useCallback((method: string): boolean => {
    return availableChannels.includes(method);
  }, [availableChannels]);
  
  /**
   * Get the recommended delivery method for a notification
   */
  const getRecommendedDeliveryMethod = useCallback((notification: NotificationRecord): string => {
    return extendedManager.getBestAvailableMethod(notification);
  }, [extendedManager]);
  
  // Return the hook API
  return {
    deliverNotification,
    availableChannels,
    isDeliveryMethodAvailable,
    getRecommendedDeliveryMethod,
    delivering,
    lastResult,
  };
}
