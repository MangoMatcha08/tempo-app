
/**
 * Fallback Notification Strategy
 * 
 * Provides fallback mechanism for notifications when:
 * 1. Device is offline
 * 2. Push notifications are not supported or permission denied
 * 3. Running as an iOS PWA where push notifications are limited
 */

import { 
  NotificationDeliveryStrategy, 
  NotificationDeliveryResult 
} from './NotificationStrategy';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { browserDetection } from '@/utils/browserDetection';
import { iosPwaDetection } from '@/utils/iosPwaDetection';
import { offlineNotificationManager } from '@/utils/offlineNotificationManager';
import { iosPushLogger } from '@/utils/iosPushLogger';

/**
 * Fallback strategy for delivering notifications
 */
export class FallbackNotificationStrategy implements NotificationDeliveryStrategy {
  async deliver(notification: NotificationRecord): Promise<NotificationDeliveryResult> {
    // Start performance monitoring
    const endMeasure = iosPushLogger.createPerformanceMarker('fallback-delivery');
    
    try {
      iosPushLogger.logPushEvent('fallback-delivery-attempt', { 
        id: notification.id,
        priority: notification.priority
      });
      
      // Store notification for later delivery
      offlineNotificationManager.storeOfflineNotification(notification);
      
      // If we're online, register for background sync
      if (navigator.onLine) {
        await offlineNotificationManager.registerOfflineSync();
      }
      
      // Log successful fallback
      iosPushLogger.logPushEvent('fallback-delivery-success', { id: notification.id });
      
      // End performance measurement
      const duration = endMeasure();
      
      return {
        success: true,
        id: notification.id,
        channel: 'fallback',
        timestamp: Date.now(),
        duration
      };
    } catch (error) {
      // Log error
      iosPushLogger.logErrorEvent('fallback-delivery-failed', error, { 
        id: notification.id 
      });
      
      // End performance measurement
      endMeasure();
      
      return {
        success: false,
        id: notification.id,
        channel: 'fallback',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  canDeliver(notification: NotificationRecord): boolean {
    // Can always deliver via fallback
    return true;
  }
}

/**
 * Factory function to create fallback strategy
 */
export function createFallbackStrategy(): FallbackNotificationStrategy {
  return new FallbackNotificationStrategy();
}
