
import { toast } from "sonner";

let updateAvailable = false;
let registration: ServiceWorkerRegistration | null = null;

// Register service worker
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registered successfully', registration);
      
      // Check for updates on registration
      checkForUpdates(registration);
      
      // Listen for new service workers
      registration.addEventListener('updatefound', () => {
        const newWorker = registration?.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed but waiting to activate
              console.log('New service worker available');
              updateAvailable = true;
              notifyUpdate();
            }
          });
        }
      });
      
      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (updateAvailable) {
          console.log('New service worker activated');
          // Reload the page to ensure all resources are fetched from the new service worker
          window.location.reload();
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('Service workers not supported by this browser');
    return null;
  }
}

// Check if there's an update to the service worker
async function checkForUpdates(reg: ServiceWorkerRegistration) {
  if (!navigator.onLine) {
    return;
  }
  
  try {
    // Try to update service worker
    const updated = await reg.update();
    console.log('Service worker update check completed', updated);
  } catch (error) {
    console.error('Service worker update check failed:', error);
  }
}

// Notify user about update and prompt to refresh
function notifyUpdate() {
  toast.info("Update available!", {
    description: "A new version is available. Refresh to update?",
    action: {
      label: "Update now",
      onClick: () => {
        if (registration && registration.waiting) {
          // Send message to service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    },
    duration: 10000,
  });
}

// Setup periodic update checks
export function setupPeriodicUpdateChecks(intervalMinutes = 60) {
  // Check for updates on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && registration) {
      checkForUpdates(registration);
    }
  });
  
  // Check for updates periodically
  setInterval(() => {
    if (registration) {
      checkForUpdates(registration);
    }
  }, intervalMinutes * 60 * 1000);
}

// Register for background sync
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-reminders');
      console.log('Background sync registered');
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}

// Helper to determine if the app is running as installed PWA
export function isRunningAsInstalledPwa() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true || // iOS
         document.referrer.includes('android-app://');
}
