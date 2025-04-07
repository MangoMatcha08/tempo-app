
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/serviceWorker/serviceWorkerLogger';

// Service Worker Registration and Update Management
interface CustomRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

/**
 * Register the service worker with error handling and graceful degradation
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      logger.info('Registering service worker');
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      logger.info('Service worker registration complete', { scope: registration.scope });
      
      // Set up event listeners for service worker updates
      setupUpdateListeners(registration);
      
      return registration;
    } catch (error) {
      logger.error('Service worker registration failed:', error);
      
      // Show error toast for graceful degradation
      toast({
        title: 'Limited Offline Support',
        description: 'Some features may not work properly without offline support.',
        duration: 5000,
        variant: 'destructive'
      });
      
      throw error;
    }
  } else {
    logger.warn('Service workers are not supported in this browser');
    
    // Show warning toast for graceful degradation
    toast({
      title: 'Limited App Features',
      description: 'Your browser does not support offline mode and push notifications.',
      duration: 5000,
      variant: 'destructive'
    });
    
    throw new Error('Service workers not supported');
  }
};

/**
 * Set up listeners for service worker updates
 */
const setupUpdateListeners = (registration: ServiceWorkerRegistration) => {
  // Listen for new service workers
  registration.addEventListener('updatefound', () => {
    // Get the installing service worker
    const newWorker = registration.installing;
    if (!newWorker) return;
    
    logger.info('New service worker installing');
    
    // Listen for state changes
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is installed and waiting to activate
        logger.info('New service worker installed and waiting');
        
        // Show update toast
        toast({
          title: 'App Update Available',
          description: 'Refresh to update to the latest version.',
          duration: 0, // Don't auto-close
          action: {
            label: 'Update Now',
            onClick: () => {
              // Skip waiting and reload
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      }
    });
  });
  
  // Listen for controller change (service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    logger.info('Service worker controller changed');
  });
};

/**
 * Check for service worker updates
 */
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    try {
      logger.info('Checking for service worker updates');
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        logger.info('Service worker update check complete');
      }
    } catch (error) {
      logger.error('Service worker update check failed:', error);
    }
  }
};

/**
 * Setup periodic update checks (time in minutes)
 */
export const setupPeriodicUpdateChecks = (intervalMinutes: number) => {
  // Convert minutes to milliseconds
  const interval = intervalMinutes * 60 * 1000;
  
  // Perform initial check
  checkForUpdates();
  
  // Set up periodic checks
  setInterval(checkForUpdates, interval);
  
  logger.info(`Service worker update checks scheduled every ${intervalMinutes} minutes`);
};

/**
 * Handle update found event
 */
export const onUpdateFound = (callback: () => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.addEventListener('updatefound', () => {
          logger.info('Service worker update found');
          
          // Get the new service worker
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and ready to take over
                logger.info('New service worker installed and ready');
                callback();
              }
            });
          }
        });
      }
    });
  }
};

/**
 * Prompt user to reload the page for updates
 */
export const promptUserToReload = () => {
  // Show toast notification
  toast({
    title: 'App Update Available',
    description: 'A new version of this app is available. Reload to update?',
    duration: 0, // Don't auto-close
    action: {
      label: 'Reload',
      onClick: () => {
        window.location.reload();
      }
    }
  });
};

/**
 * Register for background sync with graceful degradation
 */
export const registerBackgroundSync = async (syncTag: string) => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Use the custom interface to handle the optional sync property
      const customReg = registration as CustomRegistration;
      
      if (customReg.sync) {
        await customReg.sync.register(syncTag);
        logger.info(`Background sync registered for tag: ${syncTag}`);
        return true;
      } else {
        logger.warn('Background sync is not supported in this browser');
        return false;
      }
    } catch (error) {
      logger.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * Manually trigger an update and reload
 */
export const updateAndReload = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      window.location.reload();
    }
  }
};

/**
 * Check if a service worker is active
 */
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration && !!registration.active;
  } catch (error) {
    logger.error('Error checking service worker status:', error);
    return false;
  }
};

/**
 * Send test message to service worker
 */
export const sendTestMessageToServiceWorker = async (message: string): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    logger.warn('No active service worker');
    return false;
  }
  
  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'TEST_MESSAGE',
      payload: {
        message,
        timestamp: Date.now()
      }
    });
    return true;
  } catch (error) {
    logger.error('Error sending test message to service worker:', error);
    return false;
  }
};

/**
 * Get information about the service worker
 */
export const getServiceWorkerInfo = async () => {
  if (!('serviceWorker' in navigator)) {
    return {
      supported: false,
      active: false
    };
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return {
        supported: true,
        registered: false,
        active: false
      };
    }
    
    return {
      supported: true,
      registered: true,
      active: !!registration.active,
      waiting: !!registration.waiting,
      installing: !!registration.installing,
      scope: registration.scope
    };
  } catch (error) {
    logger.error('Error getting service worker info:', error);
    return {
      supported: true,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
