
/**
 * Notification Strategy
 * 
 * This module implements the strategy pattern for notification delivery
 * It chooses the best available notification channel based on device capabilities
 */

import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { browserDetection } from '@/utils/browserDetection';
import { offlineNotificationManager } from '@/utils/offlineNotificationManager';
import { FallbackNotificationStrategy } from './FallbackNotificationStrategy';

/**
 * Result of notification delivery attempt
 */
export interface NotificationDeliveryResult {
  success: boolean;
  id: string;
  channel: string;
  timestamp: number;
  duration?: number;
  error?: string;
}

/**
 * Interface for notification delivery strategies
 */
export interface NotificationDeliveryStrategy {
  deliver(notification: NotificationRecord): Promise<NotificationDeliveryResult>;
  canDeliver(notification: NotificationRecord): boolean;
}

/**
 * Main notification delivery manager
 * Uses the strategy pattern to select the best delivery method
 */
class NotificationDeliveryManager {
  private strategies: NotificationDeliveryStrategy[] = [];
  private fallbackStrategy: NotificationDeliveryStrategy;
  
  constructor() {
    // Initialize with fallback strategy
    this.fallbackStrategy = new FallbackNotificationStrategy();
  }
  
  /**
   * Register a delivery strategy
   */
  registerStrategy(strategy: NotificationDeliveryStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * Deliver a notification using the best available strategy
   */
  async deliverNotification(notification: NotificationRecord): Promise<NotificationDeliveryResult> {
    // Check if we should use fallback delivery
    if (offlineNotificationManager.shouldUseFallbackDelivery()) {
      console.log('Using fallback delivery for notification');
      return this.fallbackStrategy.deliver(notification);
    }
    
    // Find the first strategy that can deliver this notification
    for (const strategy of this.strategies) {
      if (strategy.canDeliver(notification)) {
        try {
          return await strategy.deliver(notification);
        } catch (error) {
          console.error('Strategy delivery failed, trying next', error);
        }
      }
    }
    
    // If all strategies fail, use fallback
    console.log('All delivery strategies failed, using fallback');
    return this.fallbackStrategy.deliver(notification);
  }
}

// Create and export singleton instance
export const notificationDelivery = new NotificationDeliveryManager();

// Helper function to initialize strategies
export function initializeNotificationStrategies(): void {
  // Register strategies here when implemented
  // This would typically happen in the app initialization
}

export default notificationDelivery;
