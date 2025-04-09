
/**
 * Browser detection utilities
 * Used to detect browsers and apply platform-specific handling
 */

export const browserDetection = {
  // Check if device is running iOS
  isIOS: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  },
  
  // Check if browser is Safari
  isSafari: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return !!ua.match(/Version\/[\d.]+.*Safari/);
  },
  
  // Check if iOS Safari
  isIOSSafari: (): boolean => {
    return browserDetection.isIOS() && browserDetection.isSafari();
  },
  
  // Check if iOS PWA
  isIOSPWA: (): boolean => {
    return browserDetection.isIOS() && (typeof window !== 'undefined' && window.navigator.standalone === true);
  },
  
  // Get iOS version
  getIOSVersion: (): number | null => {
    if (!browserDetection.isIOS()) return null;
    
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    return match ? parseFloat(`${match[1]}.${match[2]}`) : null;
  },
  
  // Check if iOS version supports web push (16.4+)
  supportsIOSWebPush: (): boolean => {
    const iosVersion = browserDetection.getIOSVersion();
    return iosVersion !== null && iosVersion >= 16.4;
  },

  // Check if push notifications are supported in this browser
  supportsPushNotifications: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'PushManager' in window && 'serviceWorker' in navigator;
  }
};
