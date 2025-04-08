
import { 
  performanceMonitor,
  notificationPerformance
} from '@/utils/performanceUtils';
import { 
  AppMessage, 
  ServiceWorkerMessage
} from '@/types/notifications/serviceWorkerTypes';

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
