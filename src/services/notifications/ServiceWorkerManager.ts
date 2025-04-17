import { 
  performanceMonitor,
  notificationPerformance
} from '@/utils/performanceUtils';
import { 
  AppMessage, 
  ServiceWorkerMessage,
} from '@/types/notifications/serviceWorkerTypes';
import { NotificationCleanupConfig, DEFAULT_CLEANUP_CONFIG } from '@/types/notifications/sharedTypes';
import { normalizeCleanupConfig } from '@/utils/notificationUtils';

/**
 * Advanced service worker registration with path detection and fallbacks
 */
async function registerServiceWorker(timeout?: number): Promise<ServiceWorkerRegistration> {
  // Try different service worker paths to avoid redirect issues
  const possiblePaths = [
    '/firebase-messaging-sw.js',
    'firebase-messaging-sw.js',
    './firebase-messaging-sw.js'
  ];
  
  let lastError: Error | null = null;
  
  // Try each path until one works
  for (const path of possiblePaths) {
    try {
      console.log(`Attempting to register service worker from: ${path}`);
      
      if (timeout) {
        return await Promise.race([
          navigator.serviceWorker.register(path, { scope: '/' }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Service worker registration timed out')), timeout)
          )
        ]);
      }
      
      // Try with explicit scope to avoid redirect issues
      return await navigator.serviceWorker.register(path, { scope: '/' });
    } catch (error) {
      console.warn(`Failed to register service worker from ${path}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If error is not related to a redirect, try checking if the file exists
      if (error instanceof Error && !error.message.includes('redirect')) {
        try {
          // Attempt to fetch the file directly to check if it exists
          const response = await fetch(path);
          console.log(`Service worker file ${path} fetch status:`, response.status);
        } catch (fetchError) {
          console.warn(`Service worker file ${path} fetch failed:`, fetchError);
        }
      }
    }
  }
  
  // If all paths failed, throw the last error
  throw lastError || new Error('Failed to register service worker from any available path');
}

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
    cleanupConfig?: Partial<NotificationCleanupConfig>;
  }): Promise<boolean> {
    // Extract cleanupConfig from the rest of the config properties
    const { cleanupConfig, ...restConfig } = config;
    
    // Handle case where cleanupConfig is provided
    if (cleanupConfig) {
      // Create a fully-formed config object with all required properties
      const fullConfig: NotificationCleanupConfig = {
        // Required properties with fallbacks
        enabled: cleanupConfig.enabled ?? DEFAULT_CLEANUP_CONFIG.enabled,
        maxAgeDays: cleanupConfig.maxAgeDays ?? DEFAULT_CLEANUP_CONFIG.maxAgeDays,
        maxCount: cleanupConfig.maxCount ?? DEFAULT_CLEANUP_CONFIG.maxCount,
        excludeHighPriority: cleanupConfig.excludeHighPriority ?? DEFAULT_CLEANUP_CONFIG.excludeHighPriority,
        highPriorityMaxAgeDays: cleanupConfig.highPriorityMaxAgeDays ?? DEFAULT_CLEANUP_CONFIG.highPriorityMaxAgeDays,
        
        // Optional properties
        cleanupInterval: cleanupConfig.cleanupInterval ?? DEFAULT_CLEANUP_CONFIG.cleanupInterval,
        lastCleanup: cleanupConfig.lastCleanup ?? DEFAULT_CLEANUP_CONFIG.lastCleanup,
        
        // Legacy properties for backward compatibility
        maxAge: cleanupConfig.maxAge ?? cleanupConfig.maxAgeDays ?? DEFAULT_CLEANUP_CONFIG.maxAgeDays,
        keepHighPriority: cleanupConfig.keepHighPriority ?? 
                         (cleanupConfig.excludeHighPriority !== undefined ? 
                          !cleanupConfig.excludeHighPriority : !DEFAULT_CLEANUP_CONFIG.excludeHighPriority),
        highPriorityMaxAge: cleanupConfig.highPriorityMaxAge ?? 
                           cleanupConfig.highPriorityMaxAgeDays ?? DEFAULT_CLEANUP_CONFIG.highPriorityMaxAgeDays
      };
      
      // Send message with the complete cleanupConfig
      return this.sendMessage({
        type: 'UPDATE_CONFIG',
        payload: { 
          config: {
            ...restConfig,
            cleanupConfig: fullConfig
          }
        }
      });
    }
    
    // If no cleanupConfig provided, send message without it
    return this.sendMessage({
      type: 'UPDATE_CONFIG',
      payload: { config: restConfig }
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
  
  /**
   * Check if service worker registration is valid
   * Returns useful diagnostics about the service worker status
   */
  async checkRegistration(): Promise<{
    registered: boolean;
    controlling: boolean;
    scope?: string;
    scriptURL?: string;
    state?: string;
    error?: string;
  }> {
    try {
      // Try getting any registration
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        return {
          registered: false,
          controlling: false,
          error: 'No service worker registration found'
        };
      }
      
      return {
        registered: true,
        controlling: !!navigator.serviceWorker.controller,
        scope: registration.scope,
        scriptURL: registration.active?.scriptURL || registration.installing?.scriptURL,
        state: registration.active?.state || registration.installing?.state
      };
    } catch (error) {
      return {
        registered: false,
        controlling: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Export singleton instance, registration function, and alias
export const serviceWorkerManager = new ServiceWorkerManager();
export { registerServiceWorker };
export { registerServiceWorker as ensureServiceWorker };

// Add a utility function to help diagnose service worker issues
export async function diagnoseServiceWorker(): Promise<{
  supported: boolean;
  registered: boolean;
  controlling: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let registered = false;
  let controlling = false;

  // Check if service worker is supported
  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      controlling: false,
      issues: ['Service workers are not supported in this browser'],
      recommendations: ['Try using a modern browser that supports service workers']
    };
  }

  try {
    // Check for existing registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      issues.push('No service worker registrations found');
      recommendations.push('Try registering the service worker manually');
    } else {
      const fcmRegistration = registrations.find(reg => 
        reg.active && reg.active.scriptURL.includes('firebase-messaging-sw')
      );
      
      if (!fcmRegistration) {
        issues.push('Firebase messaging service worker not found among registered workers');
        recommendations.push('Check if the firebase-messaging-sw.js file exists and is accessible');
      } else {
        registered = true;
        controlling = !!navigator.serviceWorker.controller;
        
        if (!controlling) {
          issues.push('Service worker registered but not controlling the page');
          recommendations.push('Try reloading the page or navigating to a different page');
        }
        
        if (fcmRegistration.scope !== window.location.origin + '/') {
          issues.push(`Service worker scope (${fcmRegistration.scope}) may not cover the current page`);
          recommendations.push('Register service worker with scope: "/"');
        }
      }
    }
    
    // Try to fetch the service worker file directly
    try {
      const response = await fetch('/firebase-messaging-sw.js', { cache: 'no-store' });
      if (!response.ok) {
        issues.push(`Service worker file fetch returned status: ${response.status}`);
        recommendations.push('Verify that firebase-messaging-sw.js exists in the correct location');
      }
    } catch (fetchError) {
      issues.push('Failed to fetch service worker file: ' + 
        (fetchError instanceof Error ? fetchError.message : String(fetchError)));
      recommendations.push('Check network connectivity and CORS settings');
    }
    
  } catch (error) {
    issues.push('Error checking service worker status: ' + 
      (error instanceof Error ? error.message : String(error)));
  }

  return {
    supported: true,
    registered,
    controlling,
    issues,
    recommendations
  };
}
