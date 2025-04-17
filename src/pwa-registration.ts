// Service Worker Registration and Update Management
import { browserDetection } from './utils/browserDetection';
import { iosPushLogger } from './utils/iosPushLogger';
import { SERVICE_WORKER_CONFIG, getRegistrationOptions } from './utils/serviceWorkerConfig';

interface CustomRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

/**
 * Promise-based timeout utility
 */
const timeout = <T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage || `Operation timed out after ${ms}ms`)), ms);
  });
  
  return Promise.race([promise, timeoutPromise]) as Promise<T>;
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Register the service worker with iOS-specific handling
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }
  
  try {
    // For iOS, log the registration attempt with enhanced detail
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-attempt', {
        path: SERVICE_WORKER_CONFIG.path,
        scope: SERVICE_WORKER_CONFIG.scope,
        isIOSSafari: browserDetection.isIOSSafari(),
        isPWA: browserDetection.isIOSPWA(),
        iosVersion: browserDetection.getIOSVersion()
      });
    }
    
    // Check for existing registrations that might conflict
    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
    let existingCorrectSW = null;
    
    // Log information about existing service workers
    if (existingRegistrations.length > 0) {
      console.log(`Found ${existingRegistrations.length} existing service worker(s)`);
      
      for (const reg of existingRegistrations) {
        console.log(`- Service worker: ${reg.scope}, state: ${reg.active?.state || 'unknown'}`);
        
        // Check if this is the service worker we want
        if (reg.scope.endsWith(SERVICE_WORKER_CONFIG.scope)) {
          existingCorrectSW = reg;
          console.log('  (This is our target service worker)');
        }
        
        // Log for iOS
        if (browserDetection.isIOS()) {
          iosPushLogger.logServiceWorkerEvent('existing-worker', {
            scope: reg.scope,
            scriptURL: reg.active?.scriptURL || 'unknown',
            state: reg.active?.state || 'unknown',
            isTarget: reg.scope.endsWith(SERVICE_WORKER_CONFIG.scope)
          });
        }
      }
    }
    
    // For iOS Safari, we may need to unregister conflicting service workers
    if (browserDetection.isIOSSafari() && existingRegistrations.length > 0) {
      // Look for service workers with wrong scope
      const wrongScopeWorkers = existingRegistrations.filter(
        reg => !reg.scope.endsWith(SERVICE_WORKER_CONFIG.scope)
      );
      
      // Unregister wrong scope workers on iOS
      if (wrongScopeWorkers.length > 0) {
        console.log(`Unregistering ${wrongScopeWorkers.length} service worker(s) with wrong scope`);
        
        for (const reg of wrongScopeWorkers) {
          await reg.unregister();
          console.log(`Unregistered service worker with scope: ${reg.scope}`);
          
          // Log for iOS
          if (browserDetection.isIOS()) {
            iosPushLogger.logServiceWorkerEvent('unregistered-worker', {
              scope: reg.scope
            });
          }
        }
      }
    }
    
    // Use existing registration if active and controlled
    if (existingCorrectSW && existingCorrectSW.active) {
      console.log(`Using existing service worker: ${existingCorrectSW.scope}`);
      
      // Log for iOS
      if (browserDetection.isIOS()) {
        iosPushLogger.logServiceWorkerEvent('using-existing', {
          scope: existingCorrectSW.scope,
          active: !!existingCorrectSW.active,
          controlling: !!navigator.serviceWorker.controller
        });
      }
      
      // Ensure it's controlling the page
      if (!navigator.serviceWorker.controller) {
        console.log('Service worker not controlling the page, waiting for control...');
        
        // Force the service worker to take control
        await existingCorrectSW.update();
        
        // Wait for control takeover or timeout
        await Promise.race([
          new Promise<void>(resolve => {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              console.log('Service worker now controlling the page');
              resolve();
            }, { once: true });
          }),
          new Promise<void>(resolve => setTimeout(resolve, SERVICE_WORKER_CONFIG.timing.controlTakeoverTimeout))
        ]);
      }
      
      return existingCorrectSW;
    }
    
    // Get platform-specific registration options
    const options = getRegistrationOptions();
    
    console.log(`Registering new service worker with options:`, options);
    
    // Register with timeout
    const registrationPromise = navigator.serviceWorker.register(
      SERVICE_WORKER_CONFIG.path,
      options
    );
    
    const registration = await timeout<ServiceWorkerRegistration>(
      registrationPromise,
      SERVICE_WORKER_CONFIG.timing.registrationTimeout,
      'Service worker registration timed out'
    );
    
    console.log('Service worker registration successful with scope:', registration.scope);
    
    // For iOS, log successful registration with more details
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-success', {
        scope: registration.scope,
        scriptURL: registration.installing?.scriptURL || registration.active?.scriptURL || 'unknown',
        state: registration.installing?.state || registration.active?.state || 'unknown'
      });
    }
    
    // Wait for the service worker to be activated if it's installing
    if (registration.installing) {
      console.log('Waiting for service worker to activate...');
      
      await new Promise<void>((resolve) => {
        const stateChangeListener = (event: Event) => {
          if ((event.target as ServiceWorker).state === 'activated') {
            registration.installing?.removeEventListener('statechange', stateChangeListener);
            resolve();
          }
        };
        
        registration.installing.addEventListener('statechange', stateChangeListener);
        
        // Also resolve if it's already activated somehow
        if (registration.active) {
          registration.installing.removeEventListener('statechange', stateChangeListener);
          resolve();
        }
      });
      
      console.log('Service worker activated');
      
      // Wait a bit after activation (especially important for iOS)
      await sleep(SERVICE_WORKER_CONFIG.timing.activationDelay);
    }
    
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    
    // For iOS, log registration failure with detailed error
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    
    throw error;
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
export const setupPeriodicUpdateChecks = (intervalMinutes: number = SERVICE_WORKER_CONFIG.updateInterval / (60 * 1000)) => {
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

// Export browser detection utilities
export {
  browserDetection
};
