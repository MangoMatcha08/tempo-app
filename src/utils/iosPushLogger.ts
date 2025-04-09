
import { browserDetection } from './browserDetection';

/**
 * Enhanced logger for iOS push notification debugging
 */
export const iosPushLogger = {
  // Context information
  context: {
    deviceType: null as string | null,
    iosVersion: null as string | null,
    safariVersion: null as string | null,
    installationMode: null as 'standalone' | 'browser' | null,
    pushSupported: null as boolean | null
  },
  
  // Initialize with device detection
  init(): void {
    if (typeof window === 'undefined') return;
    
    // Detect iOS
    if (!browserDetection.isIOS()) {
      this.context.deviceType = 'non-ios';
      return;
    }
    
    // Get iOS version
    const ua = navigator.userAgent;
    const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
    this.context.iosVersion = match ? `${match[1]}.${match[2]}` : 'unknown';
    
    // Get Safari version
    const safariMatch = ua.match(/Version\/(\d+)\.(\d+)/);
    this.context.safariVersion = safariMatch ? `${safariMatch[1]}.${safariMatch[2]}` : 'unknown';
    
    // Check installation mode
    this.context.installationMode = (navigator as any).standalone ? 'standalone' : 'browser';
    
    // Check push support
    this.context.pushSupported = 'PushManager' in window && 
                                parseFloat(this.context.iosVersion || '0') >= 16.4;
    
    console.log('iOS Push Logger initialized:', this.context);
  },
  
  // Log push-related events with iOS context
  logPushEvent(eventName: string, data: Record<string, any> = {}): void {
    const logData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      context: this.context,
      ...data
    };
    
    // Log to console with special formatting for iOS events
    console.log(
      `%c iOS Push Event: ${eventName}`,
      'background: #0070C9; color: white; padding: 2px 5px; border-radius: 3px;',
      logData
    );
    
    // Could also send to analytics or remote logging service
    if (eventName.includes('error') || eventName.includes('fail')) {
      this.reportError(eventName, logData);
    }
  },
  
  // Specialized error reporting for iOS push issues
  reportError(errorType: string, errorData: Record<string, any>): void {
    console.error(`iOS Push Error [${errorType}]:`, errorData);
    
    // Classify iOS-specific errors
    let errorCategory = 'unknown';
    if (errorData.error?.message?.includes('permission')) {
      errorCategory = 'permission';
    } else if (errorData.error?.message?.includes('token')) {
      errorCategory = 'token';
    } else if (errorData.error?.message?.includes('service worker')) {
      errorCategory = 'service-worker';
    }
    
    // Add specific iOS error details
    const enhancedErrorData = {
      ...errorData,
      errorCategory,
      iosSpecific: browserDetection.isIOS(),
      recommendedAction: this.getRecommendedAction(errorCategory)
    };
    
    // In the future, this could send to an error tracking service
    console.warn('Enhanced error data:', enhancedErrorData);
  },
  
  // Get specific recommendations based on error type
  getRecommendedAction(errorCategory: string): string {
    switch(errorCategory) {
      case 'permission':
        return 'Verify user gesture triggered permission request';
      case 'token':
        return 'Check VAPID key format and FCM configuration';
      case 'service-worker':
        return 'Ensure service worker is registered with correct scope';
      default:
        return 'Check Safari Web Inspector for detailed error information';
    }
  },
  
  // Log service worker lifecycle events
  logServiceWorkerEvent(event: string, details: Record<string, any> = {}): void {
    this.logPushEvent(`sw-${event}`, details);
  },
  
  // Log permission flow events
  logPermissionEvent(state: string, details: Record<string, any> = {}): void {
    this.logPushEvent(`permission-${state}`, details);
  }
};

// Initialize logger immediately when imported
if (typeof window !== 'undefined') {
  iosPushLogger.init();
}
