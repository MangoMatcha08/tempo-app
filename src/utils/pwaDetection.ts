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
   * Get the current display mode
   */
  getDisplayMode(): 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser' {
    if (typeof window === 'undefined') return 'browser';

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
      hasServiceWorker: 'serviceWorker' in navigator
    };
  }

  /**
   * Show installation prompt if available
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false;
    }

    try {
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
}

// Export a singleton instance
export const pwaDetection = PWADetection.getInstance();
