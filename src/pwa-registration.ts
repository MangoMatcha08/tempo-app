// Service Worker Registration and Update Management
import { browserDetection } from './utils/browserDetection';
import { iosPushLogger } from './utils/iosPushLogger';

interface CustomRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

// Configuration for service workers
const SERVICE_WORKER_CONFIG = {
  useEnhancedImplementation: false, // Feature flag to toggle implementation
  updateCheckInterval: 30, // minutes
  serviceWorkerPath: '/firebase-messaging-sw.js', // Use firebase-messaging-sw.js as the primary service worker
  enhancedServiceWorkerPath: '/firebase-messaging-sw.js' // Point to the same SW for simplicity
};

// Register the service worker with iOS-specific handling
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // For iOS, log the registration attempt
      if (browserDetection.isIOS()) {
        iosPushLogger.logServiceWorkerEvent('registration-attempt', {
          path: SERVICE_WORKER_CONFIG.serviceWorkerPath,
          isIOSSafari: browserDetection.isIOSSafari(),
          isPWA: browserDetection.isIOSPWA()
        });
      }
      
      // Check for existing registrations that might conflict
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      
      // iOS Safari may have issues with multiple service workers
      if (browserDetection.isIOSSafari() && existingRegistrations.length > 0) {
        console.log('Found existing service workers, checking for scope conflicts');
        
        // Log information about existing service workers
        for (const reg of existingRegistrations) {
          console.log(`Existing service worker: ${reg.scope}, state: ${reg.active?.state || 'unknown'}`);
          
          if (browserDetection.isIOS()) {
            iosPushLogger.logServiceWorkerEvent('existing-worker', {
              scope: reg.scope,
              scriptURL: reg.active?.scriptURL || 'unknown',
              state: reg.active?.state || 'unknown'
            });
          }
        }
      }
      
      // Registration options
      const registrationOptions = browserDetection.isIOS() 
        ? { scope: '/' } // Explicit scope for iOS
        : undefined;
      
      // Register the service worker
      const registration = await navigator.serviceWorker.register(
        SERVICE_WORKER_CONFIG.serviceWorkerPath,
        registrationOptions
      );
      console.log('Service worker registration complete with scope:', registration.scope);
      
      // For iOS, log successful registration
      if (browserDetection.isIOS()) {
        iosPushLogger.logServiceWorkerEvent('registration-success', {
          scope: registration.scope,
          scriptURL: registration.active?.scriptURL || registration.installing?.scriptURL || 'unknown'
        });
      }
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      
      // For iOS, log registration failure
      if (browserDetection.isIOS()) {
        iosPushLogger.logServiceWorkerEvent('registration-failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      throw error;
    }
  } else {
    console.warn('Service workers are not supported in this browser');
    throw new Error('Service workers not supported');
  }
};

// Check for service worker updates
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Service worker update check complete');
      }
    } catch (error) {
      console.error('Service worker update check failed:', error);
    }
  }
};

// Setup periodic update checks (time in minutes)
export const setupPeriodicUpdateChecks = (intervalMinutes: number = SERVICE_WORKER_CONFIG.updateCheckInterval) => {
  // Convert minutes to milliseconds
  const interval = intervalMinutes * 60 * 1000;
  
  // Perform initial check
  checkForUpdates();
  
  // Set up periodic checks
  setInterval(checkForUpdates, interval);
  
  console.log(`Service worker update checks scheduled every ${intervalMinutes} minutes`);
};

// Handle update found event
export const onUpdateFound = (callback: () => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.addEventListener('updatefound', () => {
          console.log('Service worker update found');
          
          // Get the new service worker
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and ready to take over
                console.log('New service worker installed and ready');
                callback();
              }
            });
          }
        });
      }
    });
  }
};

// Prompt user to reload the page for updates
export const promptUserToReload = () => {
  // This can be implemented with a custom UI component
  const userConfirmed = window.confirm(
    'A new version of this app is available. Reload to update?'
  );
  
  if (userConfirmed) {
    window.location.reload();
  }
};

// Register for background sync
export const registerBackgroundSync = async (syncTag: string) => {
  // For iOS Safari, background sync is not supported so we return early
  if (browserDetection.isIOS()) {
    console.log('Background sync not supported in iOS Safari');
    return false;
  }
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Use the custom interface to handle the optional sync property
      const customReg = registration as CustomRegistration;
      
      if (customReg.sync) {
        await customReg.sync.register(syncTag);
        console.log(`Background sync registered for tag: ${syncTag}`);
        return true;
      } else {
        console.warn('Background sync is not supported in this browser');
        return false;
      }
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

// Manually trigger an update and reload
export const updateAndReload = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      window.location.reload();
    }
  }
};

// Get current service worker status
export const getServiceWorkerStatus = async () => {
  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      implementation: 'none'
    };
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    // Enhanced status for iOS devices
    if (browserDetection.isIOS()) {
      return {
        supported: true,
        registered: !!registration,
        implementation: 'ios-compatible',
        version: registration?.active?.scriptURL || 'unknown',
        iosVersion: browserDetection.getIOSVersion(),
        iosSafari: browserDetection.isIOSSafari(),
        iosPWA: browserDetection.isIOSPWA(),
        scope: registration?.scope || 'unknown'
      };
    }
    
    return {
      supported: true,
      registered: !!registration,
      implementation: SERVICE_WORKER_CONFIG.useEnhancedImplementation ? 'enhanced' : 'legacy',
      version: registration?.active?.scriptURL || 'unknown'
    };
  } catch (error) {
    console.error('Error getting service worker status:', error);
    return {
      supported: true,
      registered: false,
      implementation: 'none',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Ping the service worker to check its status (useful for iOS debugging)
export const pingServiceWorker = async (): Promise<any> => {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return { error: 'No active service worker found' };
  }
  
  try {
    return new Promise((resolve, reject) => {
      // Create message channel for response
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.type === 'PONG') {
          resolve(event.data.payload);
        } else {
          reject(new Error('Invalid response from service worker'));
        }
      };
      
      // Send ping message
      navigator.serviceWorker.controller.postMessage(
        { type: 'PING', timestamp: Date.now() },
        [messageChannel.port2]
      );
      
      // Timeout after 3 seconds
      setTimeout(() => reject(new Error('Service worker ping timed out')), 3000);
    });
  } catch (error) {
    console.error('Error pinging service worker:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

// Toggle between service worker implementations
export const toggleServiceWorkerImplementation = async (useEnhanced: boolean) => {
  try {
    // Update the config
    SERVICE_WORKER_CONFIG.useEnhancedImplementation = useEnhanced;
    
    // Send message to both service workers
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'SET_IMPLEMENTATION',
        payload: {
          useNewImplementation: useEnhanced
        }
      });
      
      console.log(`Service worker implementation set to: ${useEnhanced ? 'enhanced' : 'legacy'}`);
      return true;
    }
  } catch (error) {
    console.error('Failed to toggle service worker implementation:', error);
    return false;
  }
  
  return false;
};

// Export new iOS-specific utilities
export {
  pingServiceWorker,
  browserDetection
};
