import { ServiceWorkerMessage, AppMessage } from '@/types/notifications/serviceWorkerTypes';
import { networkStatus } from '@/services/offline/networkStatus';
import { offlineQueue } from '@/services/offline/offlineQueue';
import { NotificationAction } from '@/types/notifications/notificationHistoryTypes';

/**
 * Service worker manager for handling communication with service workers
 */
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private messageListeners: Map<string, Set<(message: ServiceWorkerMessage) => void>> = new Map();
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;
  private offlineModeActive = false;
  private networkStatusUnsubscribe: (() => void) | null = null;

  /**
   * Initialize the service worker manager
   */
  async init(): Promise<boolean> {
    // Only initialize once
    if (this.isInitialized) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    return this.initPromise;
  }

  /**
   * Private initialization implementation
   */
  private async _init(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers are not supported in this browser');
        return false;
      }

      // Get the service worker registration
      try {
        this.registration = await navigator.serviceWorker.getRegistration();
        
        if (!this.registration) {
          console.log('No service worker registration found');
          return false;
        }
      } catch (error) {
        console.error('Error getting service worker registration:', error);
        return false;
      }

      // Set up message listener
      navigator.serviceWorker.addEventListener('message', this.handleMessage);

      // Set up network status listener
      this.networkStatusUnsubscribe = networkStatus.addStatusListener(this.handleNetworkStatusChange);

      this.isInitialized = true;
      console.log('Service worker manager initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize service worker manager:', error);
      return false;
    }
  }

  /**
   * Handle incoming messages from the service worker
   */
  private handleMessage = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') return;

    try {
      const message = event.data as ServiceWorkerMessage;

      // Log the message
      console.log('Received message from service worker:', message);

      // Notify all listeners for this message type
      const listeners = this.messageListeners.get(message.type) || new Set();
      
      listeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error(`Error in service worker message listener for ${message.type}:`, error);
        }
      });

      // Notify all listeners for all message types
      const allListeners = this.messageListeners.get('*') || new Set();
      
      allListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in service worker "*" message listener:', error);
        }
      });
    } catch (error) {
      console.error('Error handling service worker message:', error);
    }
  };

  /**
   * Handle network status changes
   */
  private handleNetworkStatusChange = async (online: boolean) => {
    this.offlineModeActive = !online;
    
    console.log(`Network is now ${online ? 'online' : 'offline'}`);
    
    // If we're back online, process the offline queue
    if (online) {
      console.log('Back online, processing offline queue...');
      await this.processOfflineQueue();
    }
  };

  /**
   * Process the offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    try {
      // Get all queued items
      const items = await offlineQueue.getAll();
      
      if (items.length === 0) {
        console.log('No items in offline queue to process');
        return;
      }
      
      console.log(`Processing ${items.length} items from offline queue...`);
      
      // Process each item
      for (const item of items) {
        try {
          // Skip items with too many retries
          if (item.retryCount >= 3) {
            console.log(`Skipping item ${item.id} due to too many retry attempts`);
            continue;
          }
          
          // Dispatch the action
          const success = await this.sendNotificationAction(
            item.action,
            item.reminderId,
            item.payload
          );
          
          // If successful, remove from queue
          if (success) {
            await offlineQueue.removeFromQueue(item.id);
            console.log(`Successfully processed and removed item ${item.id} from queue`);
          } else {
            // Otherwise increment retry count
            await offlineQueue.updateRetryAttempt(item.id);
            console.log(`Failed to process item ${item.id}, updated retry count`);
          }
        } catch (error) {
          console.error(`Error processing offline queue item ${item.id}:`, error);
          
          // Update retry attempt
          await offlineQueue.updateRetryAttempt(item.id);
        }
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  }

  /**
   * Add a listener for service worker messages
   * @param type Message type or '*' for all messages
   * @param listener Function to call when message is received
   * @returns Function to remove the listener
   */
  public addMessageListener(
    type: ServiceWorkerMessage['type'] | '*',
    listener: (message: ServiceWorkerMessage) => void
  ): () => void {
    // Initialize the listeners set for this type if it doesn't exist
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, new Set());
    }
    
    // Add the listener
    const listeners = this.messageListeners.get(type)!;
    listeners.add(listener);
    
    // Return a function to remove the listener
    return () => {
      if (this.messageListeners.has(type)) {
        const listeners = this.messageListeners.get(type)!;
        listeners.delete(listener);
        
        // Clean up if there are no more listeners for this type
        if (listeners.size === 0) {
          this.messageListeners.delete(type);
        }
      }
    };
  }

  /**
   * Send a message to the service worker
   */
  public async sendMessage(message: AppMessage): Promise<boolean> {
    await this.init();
    
    if (!this.registration || !this.registration.active) {
      console.error('No active service worker to send message to');
      return false;
    }
    
    try {
      console.log('Sending message to service worker:', message);
      this.registration.active.postMessage(message);
      return true;
    } catch (error) {
      console.error('Error sending message to service worker:', error);
      return false;
    }
  }

  /**
   * Check if the browser supports service workers
   */
  public isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Check if a service worker is registered
   */
  public async isServiceWorkerRegistered(): Promise<boolean> {
    if (!this.isServiceWorkerSupported()) {
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    } catch (error) {
      console.error('Error checking service worker registration:', error);
      return false;
    }
  }

  /**
   * Get the service worker registration
   */
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Send notification action to the service worker
   */
  public async sendNotificationAction(
    action: NotificationAction,
    reminderId: string,
    additionalData: any = {}
  ): Promise<boolean> {
    // Check if we're offline
    if (this.offlineModeActive) {
      console.log(`Offline mode active, queuing ${action} action for reminder ${reminderId}`);
      
      // Add to offline queue
      const queueId = await offlineQueue.addToQueue(action, reminderId, additionalData);
      
      // Return success based on whether the item was added to the queue
      return !!queueId;
    }
    
    // We're online, send directly
    return this.sendMessage({
      type: 'NOTIFICATION_ACTION',
      payload: {
        action,
        reminderId,
        ...additionalData,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Clean up event listeners
   */
  public cleanup(): void {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.handleMessage);
    }
    
    if (this.networkStatusUnsubscribe) {
      this.networkStatusUnsubscribe();
      this.networkStatusUnsubscribe = null;
    }
    
    this.messageListeners.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }
}

// Create and export a singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Export default instance for convenience
export default serviceWorkerManager;
