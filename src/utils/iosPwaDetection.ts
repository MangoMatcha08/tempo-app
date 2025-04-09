
import { browserDetection } from './browserDetection';

/**
 * Utility for detecting and working with iOS PWA state
 */
export const iosPwaDetection = {
  /**
   * Check if the app is currently running as a PWA on iOS
   */
  isRunningAsPwa(): boolean {
    return browserDetection.isIOS() && browserDetection.isIOSPWA();
  },
  
  /**
   * Check if the app is running in Safari on iOS (not as PWA)
   */
  isRunningInIOSSafari(): boolean {
    return browserDetection.isIOS() && browserDetection.isIOSSafari() && !browserDetection.isIOSPWA();
  },
  
  /**
   * Set a flag in localStorage that this PWA has been installed
   */
  markPwaInstalled(): void {
    try {
      localStorage.setItem('ios_pwa_installed', 'true');
      localStorage.setItem('ios_pwa_install_date', new Date().toISOString());
    } catch (error) {
      console.error('Error marking PWA as installed:', error);
    }
  },
  
  /**
   * Check if PWA has been previously installed according to localStorage
   */
  isPwaInstalled(): boolean {
    try {
      return localStorage.getItem('ios_pwa_installed') === 'true';
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Determine if we should show installation instructions
   * We only show them in Safari, not in PWA mode, and if we haven't marked as installed
   */
  shouldShowInstallPrompt(): boolean {
    // Only show in iOS Safari, not in other browsers or PWA mode
    if (!this.isRunningInIOSSafari()) {
      return false;
    }
    
    // Don't show if already marked as installed
    if (this.isPwaInstalled()) {
      return false;
    }
    
    // Only show for iOS 16.4+
    const iosVersionString = browserDetection.getIOSVersion() || '0';
    const iosVersion = parseFloat(iosVersionString);
    return iosVersion >= 16.4;
  }
};

/**
 * Hook to detect PWA installation status on iOS
 */
export const useIOSPwaDetection = () => {
  return {
    isRunningAsPwa: iosPwaDetection.isRunningAsPwa(),
    isRunningInIOSSafari: iosPwaDetection.isRunningInIOSSafari(),
    isPwaInstalled: iosPwaDetection.isPwaInstalled(),
    shouldShowInstallPrompt: iosPwaDetection.shouldShowInstallPrompt(),
    markPwaInstalled: iosPwaDetection.markPwaInstalled
  };
};
