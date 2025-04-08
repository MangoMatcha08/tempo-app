
import { toast } from '@/hooks/use-toast';
import { logger } from '@/services/serviceWorker/serviceWorkerLogger';
import { ToastAction } from '@/components/ui/toast';

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
          action: (
            <ToastAction
              altText="Update Now"
              onClick={() => {
                // Skip waiting and reload
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }}
            >
              Update Now
            </ToastAction>
          )
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
 * Check for updates to the service worker
 */
export const checkForUpdates = async (registration: CustomRegistration) => {
  try {
    logger.info('Checking for service worker updates');
    await registration.update();
  } catch (error) {
    logger.error('Failed to check for service worker updates:', error);
  }
};

/**
 * Set up periodic update checks
 */
export const setupPeriodicUpdateChecks = (registration: CustomRegistration) => {
  // Check for updates every hour
  setInterval(() => {
    checkForUpdates(registration);
  }, 3600000);
};

/**
 * Prompt user to reload the page for updates
 */
export const promptUserToReload = () => {
  // Show toast notification
  toast({
    title: 'App Update Available',
    description: 'A new version of this app is available. Reload to update?',
    action: (
      <ToastAction
        altText="Reload"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload
      </ToastAction>
    )
  });
};

/**
 * Handle the service worker message event
 */
export const handleServiceWorkerMessage = (event: MessageEvent) => {
  const message = event.data;
  
  // Handle different message types
  switch (message.type) {
    case 'UPDATE_AVAILABLE':
      promptUserToReload();
      break;
    default:
      console.warn('Unknown message from service worker:', message);
  }
};
