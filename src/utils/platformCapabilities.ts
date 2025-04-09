
/**
 * Platform Capabilities Detection
 * 
 * A capability-first approach to detecting platform features.
 * Instead of relying on user agent strings, we test for actual API availability
 * with user agent as fallback only when necessary.
 */

import { browserDetection } from './browserDetection';

/**
 * Cache for expensive detection operations
 */
const detectionCache: Record<string, any> = {};

/**
 * Feature detection interface
 */
export interface PlatformCapabilities {
  // Core capabilities
  serviceWorker: boolean;
  pushManager: boolean;
  notifications: boolean;
  periodicSync: boolean;
  backgroundSync: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  
  // PWA capabilities
  isPwa: boolean;
  installable: boolean;
  standalone: boolean;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
  
  // Platform details
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  
  // iOS specific details
  iosVersion: number | null;
  iosSupportsPush: boolean;
  
  // Notification specific capabilities
  notificationPermission: NotificationPermission;
  maxActions: number;
  requiresUserInteraction: boolean;
  supportsVibration: boolean;
  
  // Debugging info
  detectionMethod: 'capability' | 'useragent' | 'mixed';
  userAgent: string;
}

/**
 * Detect if running as a PWA
 */
export function detectPwa(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Cache result
  if ('isPwa' in detectionCache) {
    return detectionCache.isPwa;
  }

  // First method: display-mode CSS media query
  const matchMedia = window.matchMedia?.('(display-mode: standalone)').matches;
  
  // Second method: navigator.standalone (iOS specific)
  const navStandalone = (navigator as any).standalone === true;
  
  // Third method: check if we have a manifest and service worker
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  // Use a combination of methods for most reliable detection
  const isPwa = matchMedia || navStandalone || (hasManifest && hasServiceWorker && window.matchMedia?.('(display-mode: browser)').matches === false);
  
  // Cache result
  detectionCache.isPwa = isPwa;
  
  return isPwa;
}

/**
 * Detect service worker capabilities
 */
export function detectServiceWorkerCapabilities(): {
  supported: boolean;
  scope?: string;
  controller?: ServiceWorker | null;
  capabilities: string[];
} {
  // Check for service worker support
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { supported: false, capabilities: [] };
  }
  
  // Check for basic service worker capabilities
  const capabilities: string[] = [];
  
  if ('serviceWorker' in navigator) capabilities.push('registration');
  if (navigator.serviceWorker?.controller) capabilities.push('controlled');
  
  // Check for advanced capabilities
  if ('SyncManager' in window) capabilities.push('background-sync');
  if ('PeriodicSyncManager' in window) capabilities.push('periodic-sync');
  if ('CacheStorage' in window) capabilities.push('cache-api');
  
  return {
    supported: true,
    scope: navigator.serviceWorker.controller?.scriptURL,
    controller: navigator.serviceWorker.controller,
    capabilities
  };
}

/**
 * Detect notification capabilities
 */
export function detectNotificationCapabilities(): {
  supported: boolean;
  permission: NotificationPermission;
  maxActions: number;
  requiresInteraction?: boolean;
} {
  // Check if notifications are supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'denied', maxActions: 0 };
  }
  
  // Get current permission
  const permission = Notification.permission;
  
  // Check how many actions are supported
  const maxActions = 'maxActions' in Notification ? (Notification as any).maxActions || 2 : 2;
  
  // Check if requiresInteraction is supported
  const supportsRequiresInteraction = 'requireInteraction' in Notification.prototype;
  
  return {
    supported: true,
    permission,
    maxActions,
    requiresInteraction: supportsRequiresInteraction
  };
}

/**
 * Detect push capabilities
 */
export function detectPushCapabilities(): {
  supported: boolean;
  encryption: boolean;
  userVisibleOnly: boolean;
} {
  // Check if Push API is supported
  if (typeof window === 'undefined' || !('PushManager' in window)) {
    return { supported: false, encryption: false, userVisibleOnly: false };
  }
  
  // Check for encryption support
  const supportsEncryption = 'supportedContentEncodings' in PushManager;
  
  // Check for userVisibleOnly
  const supportsUserVisibleOnly = true; // All modern push implementations require this
  
  return {
    supported: true,
    encryption: supportsEncryption,
    userVisibleOnly: supportsUserVisibleOnly
  };
}

/**
 * Get complete platform capabilities
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  // Use cached result if available
  if ('fullCapabilities' in detectionCache) {
    return detectionCache.fullCapabilities;
  }
  
  // Start with basic platform info
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Detect using capabilities first
  const serviceWorkerCapabilities = detectServiceWorkerCapabilities();
  const notificationCapabilities = detectNotificationCapabilities();
  const pushCapabilities = detectPushCapabilities();
  const isPwa = detectPwa();
  
  // For features that can only be detected via user agent
  const isIOS = browserDetection.isIOS(); 
  const iosVersion = browserDetection.getIOSVersion();
  const isAndroid = userAgent.includes('Android');
  const isMobile = isIOS || isAndroid || (typeof window !== 'undefined' && window.innerWidth < 768);
  
  // Determine which detection method was primarily used
  const detectionMethod = serviceWorkerCapabilities.supported && notificationCapabilities.supported 
    ? 'capability' 
    : (userAgent ? 'mixed' : 'useragent');
  
  // Complete platform capabilities
  const capabilities: PlatformCapabilities = {
    // Core capabilities
    serviceWorker: serviceWorkerCapabilities.supported,
    pushManager: pushCapabilities.supported,
    notifications: notificationCapabilities.supported,
    periodicSync: serviceWorkerCapabilities.capabilities.includes('periodic-sync'),
    backgroundSync: serviceWorkerCapabilities.capabilities.includes('background-sync'),
    indexedDB: typeof window !== 'undefined' && 'indexedDB' in window,
    localStorage: typeof window !== 'undefined' && 'localStorage' in window,
    
    // PWA capabilities
    isPwa,
    installable: !isPwa && serviceWorkerCapabilities.supported && 
      document.querySelector('link[rel="manifest"]') !== null,
    standalone: isPwa,
    displayMode: isPwa ? 'standalone' : 'browser',
    
    // Platform details
    isIOS,
    isAndroid,
    isMobile,
    
    // iOS specific details
    iosVersion,
    iosSupportsPush: isIOS && iosVersion !== null && iosVersion >= 16.4,
    
    // Notification specific capabilities
    notificationPermission: notificationCapabilities.permission,
    maxActions: notificationCapabilities.maxActions,
    requiresUserInteraction: !!notificationCapabilities.requiresInteraction,
    supportsVibration: typeof window !== 'undefined' && 'vibrate' in navigator,
    
    // Debugging info
    detectionMethod,
    userAgent
  };
  
  // Cache results
  detectionCache.fullCapabilities = capabilities;
  
  return capabilities;
}

/**
 * Reset the detection cache
 * Useful for testing and after significant state changes (like installing as PWA)
 */
export function resetCapabilitiesCache(): void {
  for (const key in detectionCache) {
    delete detectionCache[key];
  }
}

/**
 * Get iOS notification support details
 * This provides specific information about iOS notification support
 */
export function getIOSNotificationSupport() {
  const capabilities = getPlatformCapabilities();
  
  if (!capabilities.isIOS) {
    return {
      supported: false,
      reason: 'Not an iOS device',
      details: null
    };
  }
  
  // For iOS, we need PWA and version 16.4+
  if (!capabilities.iosVersion || capabilities.iosVersion < 16.4) {
    return {
      supported: false,
      reason: 'iOS version too low',
      currentVersion: capabilities.iosVersion,
      minimumVersion: 16.4,
      details: {
        swSupported: capabilities.serviceWorker,
        notificationsSupported: capabilities.notifications
      }
    };
  }
  
  // Check if running as PWA
  if (!capabilities.isPwa) {
    return {
      supported: false,
      reason: 'Not running as PWA',
      details: {
        needsInstallation: true,
        swSupported: capabilities.serviceWorker,
        notificationsSupported: capabilities.notifications
      }
    };
  }
  
  // All conditions met
  return {
    supported: true,
    version: capabilities.iosVersion,
    details: {
      isPwa: true,
      swSupported: capabilities.serviceWorker,
      pushSupported: capabilities.pushManager,
      notificationsSupported: capabilities.notifications
    }
  };
}

/**
 * Platform capability testing utilities for simulating different environments
 * Only available in development mode
 */
export const testingUtils = process.env.NODE_ENV !== 'production' ? {
  /**
   * Simulate iOS environment
   */
  simulateIOS(version: number = 16.4, isPwa: boolean = false): void {
    // Only for testing in development
    console.log(`[Testing] Simulating iOS ${version} ${isPwa ? 'PWA' : 'browser'}`);
    
    // Override detection cache
    detectionCache.fullCapabilities = {
      ...getPlatformCapabilities(),
      isIOS: true,
      iosVersion: version,
      isPwa,
      standalone: isPwa,
      displayMode: isPwa ? 'standalone' : 'browser',
      iosSupportsPush: version >= 16.4 && isPwa
    };
  },
  
  /**
   * Reset simulation
   */
  resetSimulation(): void {
    resetCapabilitiesCache();
    console.log('[Testing] Reset environment simulation');
  }
} : undefined;

export default {
  getPlatformCapabilities,
  detectPwa,
  detectServiceWorkerCapabilities,
  detectNotificationCapabilities,
  detectPushCapabilities,
  getIOSNotificationSupport,
  resetCapabilitiesCache,
  testingUtils
};
