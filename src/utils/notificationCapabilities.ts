/**
 * Notification Capabilities Utility
 * 
 * Provides capability-based notification support instead of platform-based.
 * This allows for more flexible and future-proof notification handling.
 */

import { getPlatformCapabilities } from './platformCapabilities';

/**
 * Available notification methods
 */
export enum NotificationMethod {
  NATIVE_PUSH = 'native_push',
  SERVICE_WORKER = 'service_worker',
  WEB_PUSH = 'web_push',
  IN_APP = 'in_app',
  FALLBACK = 'fallback'
}

/**
 * Notification capabilities interface
 */
export interface NotificationCapabilities {
  supported: boolean;
  availableMethods: NotificationMethod[];
  preferredMethod: NotificationMethod;
  permission: NotificationPermission;
  requiresUserGesture: boolean;
  canVibrate: boolean;
  maxActions: number;
  canSchedule: boolean;
  shouldPromptInstall: boolean;
}

/**
 * Get available notification methods based on current capabilities
 */
export function getAvailableNotificationMethods(): NotificationMethod[] {
  const capabilities = getPlatformCapabilities();
  const methods: NotificationMethod[] = [];
  
  // In-app notifications are always available as fallback
  methods.push(NotificationMethod.IN_APP);
  
  // Check if we can use native Notification API
  if (capabilities.notifications) {
    methods.push(NotificationMethod.NATIVE_PUSH);
  }
  
  // Check if service worker is available
  if (capabilities.serviceWorker) {
    methods.push(NotificationMethod.SERVICE_WORKER);
  }
  
  // Check if Web Push API is available
  if (capabilities.pushManager && capabilities.serviceWorker) {
    methods.push(NotificationMethod.WEB_PUSH);
  }
  
  // Add fallback method
  methods.push(NotificationMethod.FALLBACK);
  
  return methods;
}

/**
 * Get the best notification method for the current environment
 */
export function determinePreferredNotificationMethod(): NotificationMethod {
  const capabilities = getPlatformCapabilities();
  const methods = getAvailableNotificationMethods();
  
  // If permission is granted, prefer web push when available
  if (capabilities.notificationPermission === 'granted') {
    if (methods.includes(NotificationMethod.WEB_PUSH)) {
      return NotificationMethod.WEB_PUSH;
    } else if (methods.includes(NotificationMethod.SERVICE_WORKER)) {
      return NotificationMethod.SERVICE_WORKER;
    } else if (methods.includes(NotificationMethod.NATIVE_PUSH)) {
      return NotificationMethod.NATIVE_PUSH;
    }
  }
  
  // If we're on iOS in PWA mode with 16.4+, use web push
  if (capabilities.isIOS && capabilities.iosSupportsPush && capabilities.isPwa) {
    if (methods.includes(NotificationMethod.WEB_PUSH)) {
      return NotificationMethod.WEB_PUSH;
    }
  }
  
  // Otherwise, default to in-app notifications
  return NotificationMethod.IN_APP;
}

/**
 * Check if notification showing requires a user gesture
 */
export function requiresUserGesture(): boolean {
  const capabilities = getPlatformCapabilities();
  
  // iOS always requires user gesture
  if (capabilities.isIOS) {
    return true;
  }
  
  // Check if browser requires user gesture
  if (capabilities.requiresUserInteraction) {
    return true;
  }
  
  return false;
}

/**
 * Get complete notification capabilities
 */
export function getNotificationCapabilities(): NotificationCapabilities {
  const capabilities = getPlatformCapabilities();
  const availableMethods = getAvailableNotificationMethods();
  const preferredMethod = determinePreferredNotificationMethod();
  
  return {
    supported: capabilities.notifications,
    availableMethods,
    preferredMethod,
    permission: capabilities.notificationPermission,
    requiresUserGesture: requiresUserGesture(),
    canVibrate: capabilities.supportsVibration,
    maxActions: capabilities.maxActions,
    // Can schedule notifications
    canSchedule: availableMethods.includes(NotificationMethod.SERVICE_WORKER),
    // Should prompt for PWA install (iOS Safari without PWA)
    shouldPromptInstall: capabilities.isIOS && !capabilities.isPwa
  };
}

/**
 * Check if notifications need to be upgraded (e.g., PWA installation)
 */
export function checkForNotificationUpgradePath(): {
  canUpgrade: boolean;
  upgradePath?: 'install_pwa' | 'request_permission' | 'service_worker';
  currentMethod: NotificationMethod;
  upgradedMethod: NotificationMethod;
} {
  const capabilities = getPlatformCapabilities();
  const notificationCapabilities = getNotificationCapabilities();
  
  // iOS Safari needs PWA installation
  if (capabilities.isIOS && !capabilities.isPwa && capabilities.iosVersion && capabilities.iosVersion >= 16.4) {
    return {
      canUpgrade: true,
      upgradePath: 'install_pwa',
      currentMethod: notificationCapabilities.preferredMethod,
      upgradedMethod: NotificationMethod.WEB_PUSH
    };
  }
  
  // Missing permission
  if (capabilities.notifications && capabilities.notificationPermission !== 'granted') {
    return {
      canUpgrade: true,
      upgradePath: 'request_permission',
      currentMethod: notificationCapabilities.preferredMethod,
      upgradedMethod: 
        capabilities.pushManager && capabilities.serviceWorker ? 
        NotificationMethod.WEB_PUSH : 
        NotificationMethod.NATIVE_PUSH
    };
  }
  
  // Missing service worker
  if (capabilities.notifications && !capabilities.serviceWorker && 'serviceWorker' in navigator) {
    return {
      canUpgrade: true,
      upgradePath: 'service_worker',
      currentMethod: notificationCapabilities.preferredMethod,
      upgradedMethod: NotificationMethod.SERVICE_WORKER
    };
  }
  
  // No upgrade path available
  return {
    canUpgrade: false,
    currentMethod: notificationCapabilities.preferredMethod,
    upgradedMethod: notificationCapabilities.preferredMethod
  };
}

export default {
  getNotificationCapabilities,
  getAvailableNotificationMethods,
  determinePreferredNotificationMethod,
  checkForNotificationUpgradePath,
  NotificationMethod
};
