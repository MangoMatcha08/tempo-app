
/**
 * Platform Adapter Pattern
 * 
 * This adapter provides a consistent interface for platform-specific operations
 * regardless of the underlying platform (iOS, Android, Desktop, etc.)
 */

import { getPlatformCapabilities } from '@/utils/platformCapabilities';

export interface PlatformCapability {
  isSupported: boolean;
  requiresPermission: boolean;
  requiresUserGesture: boolean;
}

export interface PlatformFeatures {
  webPush: PlatformCapability;
  serviceWorker: PlatformCapability;
  notifications: PlatformCapability;
  vibration: PlatformCapability;
  pwa: PlatformCapability;
}

export interface PlatformInfo {
  name: string;
  version: string | null;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isMobile: boolean;
  isPWA: boolean;
  features: PlatformFeatures;
}

/**
 * Abstract Platform Adapter
 */
export abstract class PlatformAdapter {
  abstract getPlatformInfo(): PlatformInfo;
  abstract requestPermission(feature: keyof PlatformFeatures): Promise<boolean>;
  abstract isPermissionGranted(feature: keyof PlatformFeatures): boolean;
  abstract supportsFeature(feature: keyof PlatformFeatures): boolean;
}

/**
 * Web Platform Adapter implementation
 */
export class WebPlatformAdapter extends PlatformAdapter {
  getPlatformInfo(): PlatformInfo {
    const capabilities = getPlatformCapabilities();
    
    return {
      name: capabilities.isIOS ? 'iOS' : capabilities.isAndroid ? 'Android' : 'Web',
      version: capabilities.iosVersion !== null ? String(capabilities.iosVersion) : null,
      isIOS: capabilities.isIOS,
      isAndroid: capabilities.isAndroid,
      isDesktop: !capabilities.isMobile,
      isMobile: capabilities.isMobile,
      isPWA: capabilities.isPwa,
      features: {
        webPush: {
          isSupported: capabilities.pushManager && capabilities.serviceWorker,
          requiresPermission: true,
          requiresUserGesture: capabilities.isIOS
        },
        serviceWorker: {
          isSupported: capabilities.serviceWorker,
          requiresPermission: false,
          requiresUserGesture: false
        },
        notifications: {
          isSupported: capabilities.notifications,
          requiresPermission: true,
          requiresUserGesture: capabilities.requiresUserInteraction
        },
        vibration: {
          isSupported: capabilities.supportsVibration,
          requiresPermission: false,
          requiresUserGesture: true
        },
        pwa: {
          isSupported: true,
          requiresPermission: false,
          requiresUserGesture: true
        }
      }
    };
  }
  
  async requestPermission(feature: keyof PlatformFeatures): Promise<boolean> {
    const info = this.getPlatformInfo();
    
    if (!info.features[feature]?.isSupported) {
      return false;
    }
    
    if (feature === 'notifications' || feature === 'webPush') {
      if (typeof Notification !== 'undefined') {
        try {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          return false;
        }
      }
    }
    
    return false;
  }
  
  isPermissionGranted(feature: keyof PlatformFeatures): boolean {
    if (feature === 'notifications' || feature === 'webPush') {
      return typeof Notification !== 'undefined' && Notification.permission === 'granted';
    }
    
    return true; // Features that don't require permission
  }
  
  supportsFeature(feature: keyof PlatformFeatures): boolean {
    const info = this.getPlatformInfo();
    return info.features[feature]?.isSupported || false;
  }
}

// Factory function to get the appropriate platform adapter
export function getPlatformAdapter(): PlatformAdapter {
  // Currently we only have the web adapter, but this factory
  // allows us to add other adapters in the future (like React Native)
  return new WebPlatformAdapter();
}
