
/**
 * iOS PWA Detection Utilities
 * 
 * Utilities for detecting if the application is running as a PWA on iOS
 */

import { browserDetection } from './browserDetection';

/**
 * Detects if the application is running as a PWA (Progressive Web App)
 * on an iOS device.
 */
export const iosPwaDetection = {
  /**
   * Checks if the current session is running as an installed PWA on iOS
   * 
   * @returns boolean True if running as PWA on iOS
   */
  isRunningAsPwa: (): boolean => {
    // Must be iOS first
    if (!browserDetection.isIOS()) {
      return false;
    }

    // iOS PWA detection relies on several signals
    
    // Check for standalone mode (most reliable signal)
    const isStandalone = window.navigator.standalone === true;

    // Check for display-mode: standalone (less reliable on iOS)
    const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check for Safari in User-Agent (PWA will NOT contain Safari in UA)
    const isSafariMissing = !/safari/i.test(navigator.userAgent);
    
    // Check for absence of Safari UI elements that are missing in PWA
    const hasPwaCharacteristics = (): boolean => {
      // PWAs run on iOS have limited access to some Safari APIs
      // Most reliable check is window.navigator.standalone
      return isStandalone;
    };

    // Combine signals - standalone mode is the most reliable indicator
    return isStandalone || 
           (isDisplayModeStandalone && isSafariMissing) ||
           (isSafariMissing && hasPwaCharacteristics());
  },
  
  /**
   * Checks if the app is being viewed in the App Store preview
   * 
   * @returns boolean True if in App Store preview
   */
  isInAppStorePreview: (): boolean => {
    return /AppStore/i.test(navigator.userAgent);
  },
  
  /**
   * Gets PWA installation instructions for the current device
   */
  getInstallInstructions: () => {
    if (browserDetection.isIOSSafari()) {
      return {
        platform: 'ios-safari',
        steps: [
          'Tap the Share button in Safari (box with arrow pointing up)',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the upper right corner',
          'Return to your home screen to find the app'
        ]
      };
    } else if (browserDetection.isIOS()) {
      return {
        platform: 'ios-other',
        steps: [
          'Open this site in Safari (tap the menu and select "Open in Safari")',
          'Tap the Share button (box with arrow pointing up)',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" and return to your home screen'
        ]
      };
    } else {
      return {
        platform: 'other',
        steps: [
          'This feature requires installation as a PWA',
          'Please visit this site on an iOS device using Safari'
        ]
      };
    }
  }
};

export default iosPwaDetection;
