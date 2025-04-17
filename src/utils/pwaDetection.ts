
import { browserDetection } from './browserDetection';
import { getPlatformCapabilities } from './platformCapabilities';
import { 
  PWAEnvironment, 
  PWACapabilities, 
  InstallationEvent 
} from '@/types/pwa';

/**
 * Enhanced PWA Detection Module
 * Provides unified PWA detection and capabilities across platforms
 */

const INSTALLATION_STORAGE_KEY = 'pwa-installation-state';

export class PWADetection {
  private static instance: PWADetection;
  private installPromptEvent: any = null;
  private installPromptShown: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.installPromptEvent = e;
      });

      // Listen for appinstalled event
      window.addEventListener('appinstalled', () => {
        this.markAsInstalled();
      });
    }
  }

  static getInstance(): PWADetection {
    if (!PWADetection.instance) {
      PWADetection.instance = new PWADetection();
    }
    return PWADetection.instance;
  }

  /**
   * Check if the app is currently running as a PWA
   */
  isPWA(): boolean {
    if (typeof window === 'undefined') return false;

    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (navigator as any).standalone === true;
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const hasServiceWorker = 'serviceWorker' in navigator;

    return displayModeStandalone || isIOSStandalone || (!!manifestLink && hasServiceWorker);
  }

  /**
   * Check specifically if running as iOS PWA 
   */
  isIOSPWA(): boolean {
    return browserDetection.isIOS() && this.isPWA();
  }

  /**
   * Get the current display mode
   */
  getDisplayMode(): 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser' {
    if (typeof window === 'undefined') return 'browser';

    // Check for iOS standalone mode first
    if (browserDetection.isIOS() && (navigator as any).standalone === true) {
      return 'standalone';
    }

    const modes: Array<'standalone' | 'minimal-ui' | 'fullscreen' | 'browser'> = 
      ['standalone', 'minimal-ui', 'fullscreen'];

    for (const mode of modes) {
      if (window.matchMedia(`(display-mode: ${mode})`).matches) {
        return mode;
      }
    }

    return 'browser';
  }

  /**
   * Check if the app can be installed
   */
  canInstall(): boolean {
    return !!this.installPromptEvent || 
           (browserDetection.isIOSSafari() && !this.isPWA());
  }

  /**
   * Get the complete PWA environment information
   */
  getPWAEnvironment(): PWAEnvironment {
    const capabilities = getPlatformCapabilities();

    return {
      isPwa: this.isPWA(),
      isStandalone: this.getDisplayMode() === 'standalone',
      displayMode: this.getDisplayMode(),
      installationStatus: this.getInstallationStatus(),
      isInstallPromptAvailable: !!this.installPromptEvent,
      platform: capabilities.isIOS ? 'ios' : 
                capabilities.isAndroid ? 'android' : 
                capabilities.isMobile ? 'unknown' : 'desktop'
    };
  }

  /**
   * Get PWA capabilities
   */
  getCapabilities(): PWACapabilities {
    const platform = getPlatformCapabilities();
    
    return {
      canInstall: this.canInstall(),
      supportsNotifications: 'Notification' in window,
      supportsBackgroundSync: 'SyncManager' in window,
      supportsPushAPI: 'PushManager' in window,
      hasServiceWorker: 'serviceWorker' in navigator,
      // iOS-specific capability checks
      isIOSPushCapable: this.isIOSPushCapable()
    };
  }

  /**
   * Check if current iOS environment supports push notifications
   * iOS requires version 16.4+ and PWA mode
   */
  isIOSPushCapable(): boolean {
    // Not iOS
    if (!browserDetection.isIOS()) return false;
    
    // Check iOS version (16.4+ required for push)
    const iosVersion = browserDetection.getIOSVersion();
    if (!iosVersion || iosVersion < 16.4) return false;
    
    // Must be in standalone mode (PWA)
    return this.isIOSPWA();
  }

  /**
   * Show installation prompt if available
   */
  async promptInstall(): Promise<boolean> {
    // For iOS Safari, we can't programmatically trigger install
    // Return early since we need to guide users manually
    if (browserDetection.isIOSSafari() && !this.installPromptEvent) {
      this.installPromptShown = true;
      return false;
    }

    if (!this.installPromptEvent) {
      return false;
    }

    try {
      this.installPromptShown = true;
      await this.installPromptEvent.prompt();
      const choice = await this.installPromptEvent.userChoice;
      this.installPromptEvent = null;
      
      if (choice.outcome === 'accepted') {
        this.markAsInstalled();
        return true;
      }
    } catch (error) {
      console.error('Error prompting for installation:', error);
    }
    
    return false;
  }

  /**
   * Check if install prompt has been shown during this session
   */
  hasPromptBeenShown(): boolean {
    return this.installPromptShown;
  }

  /**
   * Reset the installation prompt state
   */
  resetPromptState(): void {
    this.installPromptShown = false;
  }

  /**
   * Get the current installation status
   */
  private getInstallationStatus(): 'not-installed' | 'installed' | 'installation-pending' {
    if (this.isPWA()) {
      return 'installed';
    }

    const storedStatus = localStorage.getItem(INSTALLATION_STORAGE_KEY);
    return storedStatus as 'not-installed' | 'installed' | 'installation-pending' || 'not-installed';
  }

  /**
   * Mark the PWA as installed
   */
  private markAsInstalled(): void {
    try {
      localStorage.setItem(INSTALLATION_STORAGE_KEY, 'installed');
      localStorage.setItem('pwa-installed-date', Date.now().toString());
      
      const installEvent: InstallationEvent = {
        timestamp: Date.now(),
        platform: browserDetection.getPlatform(),
        success: true,
        method: this.installPromptEvent ? 'prompt' : 'manual'
      };
      
      // Store installation event history
      const events = JSON.parse(localStorage.getItem('pwa-install-events') || '[]');
      events.push(installEvent);
      localStorage.setItem('pwa-install-events', JSON.stringify(events));
    } catch (error) {
      console.error('Error storing PWA installation state:', error);
    }
  }

  /**
   * Check if the app was recently installed
   * Useful for showing post-installation guidance
   */
  wasRecentlyInstalled(thresholdMinutes: number = 5): boolean {
    try {
      const installedTimestamp = localStorage.getItem('pwa-installed-date');
      if (!installedTimestamp) return false;
      
      const installTime = parseInt(installedTimestamp, 10);
      const thresholdMs = thresholdMinutes * 60 * 1000;
      
      return Date.now() - installTime < thresholdMs;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const pwaDetection = PWADetection.getInstance();
