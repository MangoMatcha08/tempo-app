
/**
 * Enhanced Service Worker registration with iOS-specific optimizations
 */
import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';

// Configuration options for service worker registration
export interface ServiceWorkerRegistrationOptions {
  path?: string;
  scope?: string;
  waitForActivation?: boolean;
  clearExistingWorkers?: boolean;
  debug?: boolean;
  iOS?: {
    enforceScope?: boolean;
    waitBeforeTokenRequest?: number; // ms
  };
}

const DEFAULT_OPTIONS: ServiceWorkerRegistrationOptions = {
  path: '/firebase-messaging-sw.js',
  scope: '/',
  waitForActivation: true,
  clearExistingWorkers: false,
  debug: true,
  iOS: {
    enforceScope: true,
    waitBeforeTokenRequest: 1000
  }
};

// Track registration status for debugging
let registrationStatus = {
  attempted: false,
  successful: false,
  lastError: null as Error | null,
  debugLogs: [] as string[]
};

/**
 * Log a debug message if debug mode is enabled
 */
function logDebug(message: string, options?: ServiceWorkerRegistrationOptions) {
  const shouldLog = options?.debug ?? DEFAULT_OPTIONS.debug;
  if (shouldLog) {
    console.log(`[SW Registration] ${message}`);
    registrationStatus.debugLogs.push(`${new Date().toISOString()} - ${message}`);
  }
}

/**
 * Register the service worker with iOS-specific optimizations
 */
export async function registerServiceWorker(
  options: ServiceWorkerRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  registrationStatus.attempted = true;
  
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    logDebug('Service workers not supported', mergedOptions);
    return null;
  }
  
  try {
    const isIOS = browserDetection.isIOS();
    
    // For iOS, we log additional details
    if (isIOS) {
      const iosInfo = {
        iosVersion: browserDetection.getIOSVersion(),
        isSafari: browserDetection.isSafari(),
        isPWA: browserDetection.isIOSPWA(),
        supportsWebPush: browserDetection.supportsIOSWebPush()
      };
      
      iosPushLogger.logServiceWorkerEvent('registration-start', iosInfo);
      logDebug(`Starting registration for iOS device: ${JSON.stringify(iosInfo)}`, mergedOptions);
    }
    
    // Handle potential service worker conflicts (important for iOS)
    if (mergedOptions.clearExistingWorkers) {
      const existingWorkers = await navigator.serviceWorker.getRegistrations();
      
      if (existingWorkers.length > 0) {
        logDebug(`Found ${existingWorkers.length} existing service workers, unregistering...`, mergedOptions);
        
        // iOS Safari has issues with multiple service workers, so unregister existing ones
        if (isIOS) {
          iosPushLogger.logServiceWorkerEvent('clearing-existing', {
            count: existingWorkers.length
          });
        }
        
        // Unregister all existing service workers
        await Promise.all(
          existingWorkers.map(registration => registration.unregister())
        );
        
        logDebug('Existing service workers cleared', mergedOptions);
      }
    }
    
    // Set up registration options
    const registrationOptions = {
      scope: mergedOptions.scope
    };
    
    // Register the service worker
    logDebug(`Registering service worker at ${mergedOptions.path}`, mergedOptions);
    const registration = await navigator.serviceWorker.register(
      mergedOptions.path || DEFAULT_OPTIONS.path || '',
      registrationOptions
    );
    
    // If wait for activation is true, wait for the service worker to activate
    if (mergedOptions.waitForActivation) {
      logDebug('Waiting for service worker activation...', mergedOptions);
      
      // Wait for the service worker to change state to activated
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          if (!registration.installing) {
            resolve();
            return;
          }
          
          registration.installing.addEventListener('statechange', function(e) {
            if ((e.target as any).state === 'activated') {
              logDebug('Service worker activated', mergedOptions);
              resolve();
            }
          });
        });
      }
    }
    
    // Special handling for iOS
    if (isIOS) {
      // Log successful registration
      iosPushLogger.logServiceWorkerEvent('registration-success', {
        scope: registration.scope,
        scriptURL: registration.active?.scriptURL || 'unknown'
      });
      
      // For iOS, wait a bit before returning to ensure the service worker is fully established
      if (mergedOptions.iOS?.waitBeforeTokenRequest) {
        logDebug(`Waiting ${mergedOptions.iOS.waitBeforeTokenRequest}ms for iOS service worker stabilization`, mergedOptions);
        await new Promise(resolve => setTimeout(resolve, mergedOptions.iOS?.waitBeforeTokenRequest));
      }
      
      // Verify scope is correct for iOS (it needs to be root)
      if (mergedOptions.iOS?.enforceScope && registration.scope !== `${window.location.origin}/`) {
        logDebug(`Warning: Service worker scope (${registration.scope}) may cause issues on iOS`, mergedOptions);
        iosPushLogger.logServiceWorkerEvent('scope-warning', {
          scope: registration.scope,
          recommendedScope: `${window.location.origin}/`
        });
      }
    }
    
    registrationStatus.successful = true;
    logDebug('Service worker registration successful', mergedOptions);
    return registration;
  } catch (error) {
    registrationStatus.successful = false;
    registrationStatus.lastError = error instanceof Error ? error : new Error(String(error));
    
    logDebug(`Service worker registration failed: ${error}`, mergedOptions);
    
    // Log error for iOS specifically
    if (browserDetection.isIOS()) {
      iosPushLogger.logServiceWorkerEvent('registration-failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    throw error;
  }
}

/**
 * Get the current registration status for debugging
 */
export function getRegistrationStatus() {
  return { ...registrationStatus };
}

/**
 * Clear registration status history
 */
export function clearRegistrationStatus() {
  registrationStatus.debugLogs = [];
  return true;
}

/**
 * Check if the service worker is ready
 */
export async function waitForServiceWorkerReady(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('Error waiting for service worker ready:', error);
    return null;
  }
}

/**
 * Force update the service worker
 */
export async function updateServiceWorker(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('Error updating service worker:', error);
    return false;
  }
}
