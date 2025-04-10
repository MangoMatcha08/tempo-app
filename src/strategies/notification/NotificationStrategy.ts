
/**
 * Notification Strategy Pattern
 * 
 * This pattern defines a family of algorithms for notification delivery,
 * encapsulates each one, and makes them interchangeable.
 */

import { NotificationRecord } from '@/types/notifications';
import { NotificationMethod } from '@/utils/notificationCapabilities';
import { getPlatformAdapter } from '@/adapters/platform/PlatformAdapter';

// Result of notification delivery attempt
export interface NotificationResult {
  success: boolean;
  method: NotificationMethod;
  error?: Error;
  timestamp: number;
  notificationId?: string;
}

// Base notification strategy
export interface NotificationStrategy {
  deliver(notification: NotificationRecord): Promise<NotificationResult>;
  canDeliver(): boolean;
  getPriority(): number; // Higher number = higher priority
  getMethod(): NotificationMethod;
}

// Web Push notification strategy
export class WebPushStrategy implements NotificationStrategy {
  async deliver(notification: NotificationRecord): Promise<NotificationResult> {
    try {
      if (!this.canDeliver()) {
        throw new Error('Web Push notifications not supported');
      }
      
      // In a real implementation, this would use the Push API
      console.log('Delivering notification via Web Push:', notification);
      
      // Simulate success for now
      return {
        success: true,
        method: NotificationMethod.WEB_PUSH,
        timestamp: Date.now(),
        notificationId: notification.id
      };
    } catch (error) {
      console.error('Error delivering Web Push notification:', error);
      return {
        success: false,
        method: NotificationMethod.WEB_PUSH,
        error: error instanceof Error ? error : new Error('Unknown error'),
        timestamp: Date.now(),
        notificationId: notification.id
      };
    }
  }
  
  canDeliver(): boolean {
    const adapter = getPlatformAdapter();
    return (
      adapter.supportsFeature('webPush') && 
      adapter.isPermissionGranted('webPush')
    );
  }
  
  getPriority(): number {
    return 100; // Highest priority
  }
  
  getMethod(): NotificationMethod {
    return NotificationMethod.WEB_PUSH;
  }
}

// Service Worker notification strategy
export class ServiceWorkerStrategy implements NotificationStrategy {
  async deliver(notification: NotificationRecord): Promise<NotificationResult> {
    try {
      if (!this.canDeliver()) {
        throw new Error('Service Worker notifications not supported');
      }
      
      // In a real implementation, this would use the Notifications API via Service Worker
      console.log('Delivering notification via Service Worker:', notification);
      
      // Simulate success for now
      return {
        success: true,
        method: NotificationMethod.SERVICE_WORKER,
        timestamp: Date.now(),
        notificationId: notification.id
      };
    } catch (error) {
      console.error('Error delivering Service Worker notification:', error);
      return {
        success: false,
        method: NotificationMethod.SERVICE_WORKER,
        error: error instanceof Error ? error : new Error('Unknown error'),
        timestamp: Date.now(),
        notificationId: notification.id
      };
    }
  }
  
  canDeliver(): boolean {
    const adapter = getPlatformAdapter();
    return (
      adapter.supportsFeature('serviceWorker') && 
      adapter.supportsFeature('notifications') && 
      adapter.isPermissionGranted('notifications')
    );
  }
  
  getPriority(): number {
    return 80;
  }
  
  getMethod(): NotificationMethod {
    return NotificationMethod.SERVICE_WORKER;
  }
}

// In-app notification strategy (Toast or alert)
export class InAppStrategy implements NotificationStrategy {
  async deliver(notification: NotificationRecord): Promise<NotificationResult> {
    try {
      console.log('Delivering notification via In-App:', notification);
      
      // This would typically dispatch an action to show a toast/alert
      // For now, we'll just simulate success
      return {
        success: true,
        method: NotificationMethod.IN_APP,
        timestamp: Date.now(),
        notificationId: notification.id
      };
    } catch (error) {
      console.error('Error delivering In-App notification:', error);
      return {
        success: false,
        method: NotificationMethod.IN_APP,
        error: error instanceof Error ? error : new Error('Unknown error'),
        timestamp: Date.now(),
        notificationId: notification.id
      };
    }
  }
  
  canDeliver(): boolean {
    return true; // In-app notifications are always available
  }
  
  getPriority(): number {
    return 40; // Lower priority
  }
  
  getMethod(): NotificationMethod {
    return NotificationMethod.IN_APP;
  }
}

// Fallback notification strategy
export class FallbackStrategy implements NotificationStrategy {
  async deliver(notification: NotificationRecord): Promise<NotificationResult> {
    console.log('Using fallback notification method for:', notification);
    return {
      success: true,
      method: NotificationMethod.FALLBACK,
      timestamp: Date.now(),
      notificationId: notification.id
    };
  }
  
  canDeliver(): boolean {
    return true; // Fallback is always available
  }
  
  getPriority(): number {
    return 0; // Lowest priority
  }
  
  getMethod(): NotificationMethod {
    return NotificationMethod.FALLBACK;
  }
}

// Context class that selects and uses the appropriate strategy
export class NotificationDeliveryContext {
  private strategies: NotificationStrategy[] = [];
  
  constructor() {
    // Register all available strategies in priority order
    this.registerStrategy(new WebPushStrategy());
    this.registerStrategy(new ServiceWorkerStrategy());
    this.registerStrategy(new InAppStrategy());
    this.registerStrategy(new FallbackStrategy());
  }
  
  registerStrategy(strategy: NotificationStrategy): void {
    this.strategies.push(strategy);
    // Sort by priority (highest first)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }
  
  async deliverNotification(notification: NotificationRecord): Promise<NotificationResult> {
    // Find the highest priority strategy that can deliver
    for (const strategy of this.strategies) {
      if (strategy.canDeliver()) {
        return strategy.deliver(notification);
      }
    }
    
    // If no strategy can deliver, use the fallback
    const fallback = new FallbackStrategy();
    return fallback.deliver(notification);
  }
  
  getBestAvailableMethod(): NotificationMethod {
    for (const strategy of this.strategies) {
      if (strategy.canDeliver()) {
        return strategy.getMethod();
      }
    }
    return NotificationMethod.FALLBACK;
  }
}

// Export a singleton instance
export const notificationDelivery = new NotificationDeliveryContext();
