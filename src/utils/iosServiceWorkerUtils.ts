import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';

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
    
    // Register the service worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      registrationOptions
    );
    
    console.log('Service worker registration successful with scope:', registration.scope);
    
    // For iOS, wait until the service worker is activated
    if (browserDetection.isIOS() && registration.installing) {
      await new Promise<void>(resolve => {
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
        
        // Timeout after 10 seconds
        setTimeout(() => {
          console.warn('Service worker activation timed out for iOS');
          resolve();
        }, 10000);
      });
    }
    
    // Log successful registration for iOS
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-success', {
        scope: registration.scope,
        scriptURL: registration.active?.scriptURL || 'unknown'
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
 */
export const setupIOSServiceWorker = async (): Promise<ServiceWorkerRegistrationResult> => {
  if (!browserDetection.isIOS()) {
    return { success: false, error: 'Not an iOS device' };
  }
  
  // Step 1: Clean up existing service workers
  await cleanupExistingServiceWorkers();
  
  // Add delay for iOS Safari to process the unregistration
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Step 2 & 3: Register and wait for activation
  return registerServiceWorkerForIOS();
};
