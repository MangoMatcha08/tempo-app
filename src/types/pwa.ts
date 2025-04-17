
export interface PWAEnvironment {
  isPwa: boolean;
  isStandalone: boolean;
  displayMode: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';
  installationStatus: 'not-installed' | 'installed' | 'installation-pending';
  isInstallPromptAvailable: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export interface InstallationEvent {
  timestamp: number;
  platform: string;
  success: boolean;
  method: 'prompt' | 'manual' | 'unknown';
}

export interface PWACapabilities {
  canInstall: boolean;
  supportsNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsPushAPI: boolean;
  hasServiceWorker: boolean;
  isIOSPushCapable?: boolean; // New property for iOS push capability
}
