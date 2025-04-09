
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';
import { sleep, timeout, withRetry } from './iosPermissionTimings';

interface ServiceWorkerRegistrationResult {
  success: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

/**
 * iOS-specific service worker registration utility
 * 
 * Optimizes the service worker registration process for iOS devices
 * which have stricter requirements and different behavior than other browsers
 */
export const registerServiceWorkerForIOS = async (): Promise<ServiceWorkerRegistrationResult> => {
  if (!('serviceWorker' in navigator)) {
    return { success: false, error: 'Service workers not supported' };
  }
  
  try {
    // Log registration attempt for iOS
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-attempt', {
        isIOSSafari: browserDetection.isIOSSafari(),
        isPWA: browserDetection.isIOSPWA()
      });
    }
    
    // iOS has stricter scope requirements
    const registrationOptions = browserDetection.isIOS() 
      ? { scope: '/' } // Explicit scope for iOS
      : undefined;
    
    // Use retry mechanism for iOS
    const registration = await withRetry(
      async () => {
        return await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          registrationOptions
        );
      },
      browserDetection.isIOS() ? {
        maxRetries: 3,
        baseDelayMs: 800
      } : undefined
    );
    
    console.log('Service worker registration successful with scope:', registration.scope);
    
    // For iOS, wait until the service worker is activated
    if (browserDetection.isIOS() && registration.installing) {
      await timeout(new Promise<void>(resolve => {
        const installingWorker = registration.installing;
        installingWorker?.addEventListener('statechange', () => {
          if (installingWorker.state === 'activated') {
            console.log('Service worker activated for iOS');
            iosPushLogger.logServiceWorkerEvent('activation-complete', {
              timeToActivate: Date.now() - performance.now()
            });
            resolve();
          }
        });
      }), 15000, 'Service worker activation timeout');
    }
    
    // For iOS, verify that service worker is controlling the page
    if (browserDetection.isIOS()) {
      // If not controlling, wait for it to take control
      if (!navigator.serviceWorker.controller) {
        try {
          await timeout(new Promise<void>(resolve => {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('Service worker now controlling the page');
              resolve();
            }, { once: true });
          }), 5000, 'Controller change timeout');
        } catch (error) {
          console.warn('Timed out waiting for service worker to control page:', error);
          // Continue anyway as this isn't critical
        }
      }
      
      // Log successful registration for iOS
      iosPushLogger.logServiceWorkerEvent('registration-success', {
        scope: registration.scope,
        scriptURL: registration.active?.scriptURL || 'unknown',
        controlling: !!navigator.serviceWorker.controller
      });
    }
    
    return { success: true, registration };
  } catch (error) {
    console.error('Service worker registration failed:', error);
    
    // Log failure for iOS
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Cleanup existing service worker registrations
 * 
 * This is particularly important for iOS which can have issues with multiple service workers
 */
export const cleanupExistingServiceWorkers = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    // Get all registered service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    if (registrations.length === 0) {
      return true; // No registrations to clean up
    }
    
    // Log existing service workers for iOS
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('cleanup-start', {
        existingCount: registrations.length,
        paths: registrations.map(reg => reg.active?.scriptURL || 'unknown')
      });
    }
    
    // Keep only the firebase-messaging-sw.js service worker
    // and unregister others that might cause conflicts
    const results = await Promise.all(
      registrations.map(async registration => {
        const scriptURL = registration.active?.scriptURL || '';
        
        // Only unregister non-firebase service workers
        if (!scriptURL.includes('firebase-messaging-sw.js')) {
          try {
            const success = await registration.unregister();
            return { scriptURL, success };
          } catch (error) {
            console.error(`Failed to unregister service worker ${scriptURL}:`, error);
            return { scriptURL, success: false, error };
          }
        }
        
        return { scriptURL, success: true, kept: true };
      })
    );
    
    // Log results for iOS
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('cleanup-complete', {
        results
      });
    }
    
    return results.every(r => r.success);
  } catch (error) {
    console.error('Error cleaning up service workers:', error);
    
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('cleanup-error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return false;
  }
};

/**
 * Complete iOS service worker setup
 * 
 * This performs all steps needed for iOS devices:
 * 1. Clean up any existing service workers
 * 2. Register the Firebase service worker with proper scope
 * 3. Wait for activation
 * 4. Ensure the service worker is controlling the page
 */
export const setupIOSServiceWorker = async (): Promise<ServiceWorkerRegistrationResult> => {
  if (!browserDetection.isIOS()) {
    return { success: false, error: 'Not an iOS device' };
  }
  
  // Step 1: Clean up existing service workers
  await cleanupExistingServiceWorkers();
  
  // Add delay for iOS Safari to process the unregistration
  await sleep(500);
  
  // Step 2 & 3: Register and wait for activation
  const registrationResult = await registerServiceWorkerForIOS();
  
  if (!registrationResult.success) {
    return registrationResult;
  }
  
  // Step 4: Verify page control (iOS sometimes needs a reload)
  if (!navigator.serviceWorker.controller) {
    iosPushLogger.logServiceWorkerEvent('controller-missing', {});
    
    // For PWA, we can try to force controller activation
    if (browserDetection.isIOSPWA()) {
      try {
        // Send message to service worker to claim clients
        registrationResult.registration?.active?.postMessage({
          type: 'CLAIM_CLIENTS'
        });
        
        // Wait briefly for controller to be set
        await sleep(300);
      } catch (error) {
        console.warn('Error requesting client claim:', error);
      }
    }
  }
  
  return registrationResult;
};

/**
 * Enhanced service worker message channel for iOS
 */
export class IOSServiceWorkerMessenger {
  private _messageChannel: MessageChannel | null = null;
  private _connected = false;
  private _messageQueue: { type: string; payload: any }[] = [];
  
  constructor() {
    // Setup listener for service worker changes
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Controller changed, resetting messenger');
        this._connected = false;
        this._setupChannel();
      });
    }
  }
  
  /**
   * Set up message channel to service worker
   */
  private _setupChannel(): void {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }
    
    this._messageChannel = new MessageChannel();
    this._messageChannel.port1.onmessage = this._handleMessage.bind(this);
    
    // Send init message to establish connection
    navigator.serviceWorker.controller.postMessage(
      { type: 'INIT_CHANNEL' },
      [this._messageChannel.port2]
    );
    
    // Mark as connected
    this._connected = true;
    
    // Process any queued messages
    this._processQueue();
  }
  
  /**
   * Handle incoming messages from service worker
   */
  private _handleMessage(event: MessageEvent): void {
    const { type, payload } = event.data || {};
    
    if (type === 'READY') {
      console.log('Service worker messenger ready');
    } else if (type === 'ERROR') {
      console.error('Service worker reported error:', payload);
    }
  }
  
  /**
   * Process queued messages
   */
  private _processQueue(): void {
    if (!this._connected || !navigator.serviceWorker.controller) return;
    
    // Send all queued messages
    while (this._messageQueue.length > 0) {
      const message = this._messageQueue.shift();
      if (message) {
        this.sendMessage(message.type, message.payload);
      }
    }
  }
  
  /**
   * Send message to service worker
   */
  public sendMessage(type: string, payload?: any): boolean {
    if (!('serviceWorker' in navigator)) return false;
    
    // If not connected yet, set up channel
    if (!this._connected) {
      if (navigator.serviceWorker.controller) {
        this._setupChannel();
      } else {
        // Queue message for when controller is available
        this._messageQueue.push({ type, payload });
        return true;
      }
    }
    
    // Send message
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, payload });
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if service worker is ready
   */
  public async checkReady(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return false;
    }
    
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      let timeoutId: number;
      
      // Set up response handler
      channel.port1.onmessage = (event) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(event.data?.ready === true);
      };
      
      // Send ping message
      navigator.serviceWorker.controller.postMessage(
        { type: 'PING' },
        [channel.port2]
      );
      
      // Set timeout
      timeoutId = window.setTimeout(() => resolve(false), 3000);
    });
  }
}

// Export singleton instance
export const serviceWorkerMessenger = new IOSServiceWorkerMessenger();
