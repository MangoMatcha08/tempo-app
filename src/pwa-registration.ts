
// Service Worker Registration and Update Management
interface CustomRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

// Configuration for service workers
const SERVICE_WORKER_CONFIG = {
  useEnhancedImplementation: false, // Feature flag to toggle implementation
  updateCheckInterval: 30, // minutes
  serviceWorkerPath: '/service-worker.js',
  enhancedServiceWorkerPath: '/enhanced-service-worker.js'
};

// Register the service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register the default service worker
      const registration = await navigator.serviceWorker.register(
        SERVICE_WORKER_CONFIG.serviceWorkerPath
      );
      console.log('Service worker registration complete');
      
      // Also register the enhanced worker when the flag is enabled
      if (SERVICE_WORKER_CONFIG.useEnhancedImplementation) {
        try {
          const enhancedRegistration = await navigator.serviceWorker.register(
            SERVICE_WORKER_CONFIG.enhancedServiceWorkerPath
          );
          console.log('Enhanced service worker registration complete');
        } catch (enhancedError) {
          console.error('Enhanced service worker registration failed:', enhancedError);
        }
      }
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
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
