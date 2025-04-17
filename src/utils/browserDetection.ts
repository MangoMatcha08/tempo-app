
/**
 * Browser detection utilities
 * Used to detect browsers and apply platform-specific handling
 */

export const browserDetection = {
  // Check if device is running iOS
  isIOS: (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
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
    return browserDetection.isIOS() && (typeof window !== 'undefined' && (navigator as any).standalone === true);
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
  },
  
  // Get browser name
  getBrowser: (): string => {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    
    if (ua.indexOf('Firefox') > -1) {
      return 'Firefox';
    } else if (ua.indexOf('SamsungBrowser') > -1) {
      return 'Samsung Browser';
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
      return 'Opera';
    } else if (ua.indexOf('Trident') > -1) {
      return 'Internet Explorer';
    } else if (ua.indexOf('Edge') > -1) {
      return 'Edge (Legacy)';
    } else if (ua.indexOf('Edg') > -1) {
      return 'Edge (Chromium)';
    } else if (ua.indexOf('Chrome') > -1) {
      return 'Chrome';
    } else if (ua.indexOf('Safari') > -1) {
      return 'Safari';
    } else {
      return 'Unknown';
    }
  },
  
  // Get platform
  getPlatform: (): string => {
    if (typeof navigator === 'undefined') return 'unknown';
    
    if (browserDetection.isIOS()) {
      return browserDetection.isIOSPWA() ? 'iOS (PWA)' : 'iOS';
    }
    
    const ua = navigator.userAgent;
    
    if (/Android/.test(ua)) {
      return 'Android';
    } else if (/Mac/.test(ua)) {
      return 'macOS';
    } else if (/Windows/.test(ua)) {
      return 'Windows';
    } else if (/Linux/.test(ua)) {
      return 'Linux';
    } else {
      return 'Unknown';
    }
  }
};
