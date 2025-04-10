import { 
  performanceMonitor,
  notificationPerformance
} from '@/utils/performanceUtils';
import { 
  AppMessage, 
  ServiceWorkerMessage,
  NotificationCleanupConfig
} from '@/types/notifications';  // Import from the index file instead

/**
 * Manages service worker operations with performance measurement
 */
export class ServiceWorkerManager {
  private sw: ServiceWorkerRegistration | null = null;
  
  /**
   * Initialize the service worker manager
   */
  async initialize(): Promise<boolean> {
    return notificationPerformance.measureServiceWorkerOperation('initialize', async () => {
      if (!('serviceWorker' in navigator)) {
        return false;
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        this.sw = registration;
        return true;
      } catch (error) {
        console.error('Error initializing ServiceWorkerManager:', error);
        return false;
      }
    });
  }
  
  /**
   * Send a message to the service worker with performance tracking
   */
  async sendMessage(message: AppMessage): Promise<boolean> {
    if (!this.sw || !navigator.serviceWorker.controller) {
      console.error('Service worker not ready');
      return false;
    }
    
    return notificationPerformance.measureServiceWorkerOperation(
      `send-${message.type}`, 
      async () => {
        return new Promise<boolean>((resolve) => {
          const channel = new MessageChannel();
          
          // Setup response handler
          channel.port1.onmessage = (event) => {
            if (event.data && event.data.success) {
              resolve(true);
            } else {
              resolve(false);
            }
          };
          
          // Send message to service worker
          navigator.serviceWorker.controller.postMessage(
            message, 
            [channel.port2]
          );
          
          // Timeout fallback
          setTimeout(() => resolve(false), 3000);
        });
      },
      { messageType: message.type }
    );
  }
  
  /**
   * Trigger a cache cleanup in the service worker
   */
  async triggerCacheMaintenance(): Promise<boolean> {
    return this.sendMessage({ type: 'CACHE_MAINTENANCE' });
  }
  
  /**
   * Update service worker cache configuration
   */
  async updateCacheConfig(config: {
    cachingEnabled?: boolean;
    cacheMaintenanceInterval?: number;
    debug?: boolean;
    cleanupConfig?: NotificationCleanupConfig;
  }): Promise<boolean> {
    return this.sendMessage({
      type: 'UPDATE_CONFIG',
      payload: { config }
    });
  }
  
  /**
   * Clear specific cache or all caches
   */
  async clearCache(cacheType?: 'static' | 'notifications' | 'documents' | 'images' | 'api'): Promise<boolean> {
    return this.sendMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheType }
    });
  }
  
  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return new Promise((resolve) => {
      if (!navigator.serviceWorker.controller) {
        resolve({ error: 'Service worker not active' });
        return;
      }
      
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data?.stats || { error: 'Failed to get stats' });
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [channel.port2]
      );
      
      // Timeout fallback
      setTimeout(() => resolve({ error: 'Request timed out' }), 3000);
    });
  }
  
  /**
   * Trigger notification cleanup in the service worker
   */
  async cleanupNotifications(options?: {
    force?: boolean;
    dryRun?: boolean;
    maxAge?: number;
    maxCount?: number;
  }): Promise<boolean> {
    return this.sendMessage({
      type: 'CLEANUP_NOTIFICATIONS',
      payload: { cleanupOptions: options }
    });
  }
  
  /**
   * Register a listener for service worker messages with performance tracking
   */
  registerMessageListener(
    callback: (message: ServiceWorkerMessage) => void
  ): () => void {
    const wrappedCallback = (event: MessageEvent) => {
      const markId = performanceMonitor.startMark(
        'process-sw-message',
        'service-worker',
        { messageType: event.data?.type }
      );
      
      try {
        if (event.data && typeof event.data === 'object' && 'type' in event.data) {
          callback(event.data as ServiceWorkerMessage);
        }
      } finally {
        performanceMonitor.endMark(markId);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', wrappedCallback);
    
    // Return unsubscribe function
    return () => {
      navigator.serviceWorker.removeEventListener('message', wrappedCallback);
    };
  }
  
  /**
   * Clear cached performance data
   */
  clearPerformanceData(): void {
    performanceMonitor.clearMeasurements();
  }
  
  /**
   * Get performance measurements for service worker operations
   */
  getPerformanceData() {
    return performanceMonitor.getMeasurements('service-worker');
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
