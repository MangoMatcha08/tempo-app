
/**
 * Utility functions for PWA (Progressive Web App) functionality
 */

/**
 * Check if the app is running in PWA mode
 */
export const isPWAMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

/**
 * Detect if the device is running iOS
 */
export const isIOSDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|macintosh/.test(userAgent) && 'ontouchend' in document;
};

/**
 * Detect if the device is running Android
 */
export const isAndroidDevice = (): boolean => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

/**
 * Detect if the device is a mobile device
 */
export const isMobileDevice = (): boolean => {
  return isIOSDevice() || isAndroidDevice() || 
         /webos|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
};

/**
 * Get basic device information
 */
export const getDeviceInfo = () => {
  return {
    isPWA: isPWAMode(),
    isIOS: isIOSDevice(),
    isMobile: isMobileDevice(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hasHomeScreenSupport: 'BeforeInstallPromptEvent' in window,
    hasNotificationSupport: 'Notification' in window,
    hasServiceWorker: 'serviceWorker' in navigator
  };
};
