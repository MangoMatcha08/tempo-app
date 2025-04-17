
/**
 * iOS Permission Helper Utilities
 * 
 * Shared utility functions for iOS permission handling
 */

import { browserDetection } from './browserDetection';
import { iosPwaDetection } from './iosPwaDetection';
import { PermissionErrorReason } from '@/types/notifications';

/**
 * Check if the current iOS device supports push notifications
 */
export const checkIOSPushSupport = (): { 
  supported: boolean; 
  reason?: string;
  currentVersion?: number;
  minimumVersion?: number;
} => {
  // Not iOS
  if (!browserDetection.isIOS()) {
    return { supported: false, reason: 'Not an iOS device' };
  }
  
  // Check version - iOS 16.4+ required
  const iosVersion = browserDetection.getIOSVersion();
  if (!iosVersion || iosVersion < 16.4) {
    return { 
      supported: false, 
      reason: 'iOS version too low',
      currentVersion: iosVersion,
      minimumVersion: 16.4
    };
  }
  
  // Must be installed as PWA
  if (!iosPwaDetection.isRunningAsPwa()) {
    return { supported: false, reason: 'Not running as PWA' };
  }
  
  // All checks passed
  return { supported: true };
};

/**
 * Check if the browser has the required capabilities for push notifications
 */
export function checkBrowserCapabilities() {
  const capabilities = {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notification: 'Notification' in window,
    permissions: 'permissions' in navigator
  };
  
  const supported = capabilities.serviceWorker && 
                    capabilities.pushManager && 
                    capabilities.notification;
  
  return {
    supported,
    capabilities,
    isIOS: browserDetection.isIOS(),
    iosVersion: browserDetection.getIOSVersion(),
    isPWA: iosPwaDetection.isRunningAsPwa()
  };
}

/**
 * Record telemetry for iOS push notification events
 */
export function recordPushTelemetry(event: string, data: any = {}) {
  // Only record for iOS devices
  if (!browserDetection.isIOS()) return;
  
  try {
    // Get existing telemetry
    const telemetryKey = 'ios-push-telemetry';
    const existingDataStr = localStorage.getItem(telemetryKey);
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : { events: [] };
    
    // Add new event with timestamp
    existingData.events.push({
      event,
      timestamp: Date.now(),
      data: {
        ...data,
        iosVersion: browserDetection.getIOSVersion(),
        isPWA: iosPwaDetection.isRunningAsPwa()
      }
    });
    
    // Limit number of events
    if (existingData.events.length > 100) {
      existingData.events = existingData.events.slice(-100);
    }
    
    // Save back to storage
    localStorage.setItem(telemetryKey, JSON.stringify(existingData));
  } catch (error) {
    console.error('Error recording push telemetry:', error);
  }
}
