
/**
 * iOS Push Notification Error Handler
 * 
 * Provides comprehensive error categorization and recovery actions
 * for iOS push notification permission flow errors.
 */

import { browserDetection } from './browserDetection';
import { iosPushLogger } from './iosPushLogger';

/**
 * Detailed iOS Push error categories
 */
export enum IOSPushErrorCategory {
  PERMISSION_DENIED = 'permission-denied',
  PERMISSION_PROMPT_CLOSED = 'permission-prompt-closed',
  NOT_PWA_INSTALLED = 'not-pwa-installed',
  SERVICE_WORKER_REGISTRATION_FAILED = 'sw-registration-failed',
  SERVICE_WORKER_TIMEOUT = 'sw-timeout',
  TOKEN_ACQUISITION_FAILED = 'token-acquisition-failed',
  TOKEN_EXPIRED = 'token-expired',
  UNSUPPORTED_IOS_VERSION = 'unsupported-ios-version',
  NETWORK_ERROR = 'network-error',
  UNKNOWN = 'unknown'
}

/**
 * Recovery action for an error
 */
export interface RecoveryAction {
  label: string;
  action: () => Promise<void> | void;
  description: string;
}

/**
 * Classified error with user-friendly information
 */
export interface ClassifiedError {
  category: IOSPushErrorCategory;
  userMessage: string;
  technicalDetails?: string;
  recoveryActions: RecoveryAction[];
}

/**
 * Get user-friendly message for an error category
 */
export const getUserMessageForError = (category: IOSPushErrorCategory): string => {
  switch (category) {
    case IOSPushErrorCategory.PERMISSION_DENIED:
      return "Push notification permission was denied. You'll need to enable it in your device settings.";
      
    case IOSPushErrorCategory.PERMISSION_PROMPT_CLOSED:
      return "The permission prompt was closed without selection. Please try again when you're ready.";
      
    case IOSPushErrorCategory.NOT_PWA_INSTALLED:
      return "Push notifications require installing this app to your home screen first.";
      
    case IOSPushErrorCategory.SERVICE_WORKER_REGISTRATION_FAILED:
      return "Unable to set up notifications due to a technical issue with service worker registration.";
      
    case IOSPushErrorCategory.SERVICE_WORKER_TIMEOUT:
      return "Setting up notifications is taking longer than expected. This might be due to a slow connection.";
      
    case IOSPushErrorCategory.TOKEN_ACQUISITION_FAILED:
      return "We couldn't complete the notification setup. This is usually a temporary issue.";
      
    case IOSPushErrorCategory.TOKEN_EXPIRED:
      return "Your notification settings need to be refreshed. Please try again.";
      
    case IOSPushErrorCategory.UNSUPPORTED_IOS_VERSION:
      return "Your iOS version doesn't support web push notifications. iOS 16.4 or higher is required.";
      
    case IOSPushErrorCategory.NETWORK_ERROR:
      return "A network issue prevented setting up notifications. Please check your connection and try again.";
      
    case IOSPushErrorCategory.UNKNOWN:
    default:
      return "An unexpected issue occurred while setting up notifications.";
  }
};

/**
 * Show iOS installation guide
 */
const showIOSInstallationGuide = () => {
  window.location.href = '/settings?showInstallGuide=true';
};

/**
 * Get recovery actions for an error category
 */
export const getRecoveryActions = (errorCategory: IOSPushErrorCategory): RecoveryAction[] => {
  switch (errorCategory) {
    case IOSPushErrorCategory.PERMISSION_DENIED:
      return [
        {
          label: 'Open Settings',
          description: 'Open iOS settings to enable notifications',
          action: () => {
            // Show instructions for iOS settings
            alert('To enable notifications:\n1. Open iOS Settings\n2. Tap Safari\n3. Tap Advanced > Website Data\n4. Find this website and adjust permissions');
          }
        },
        {
          label: 'Try Again Later',
          description: 'Wait 24 hours before requesting again',
          action: () => {
            // Mark to try again later
            localStorage.setItem('ios-push-retry-after', (Date.now() + 86400000).toString());
          }
        }
      ];
    
    case IOSPushErrorCategory.NOT_PWA_INSTALLED:
      return [
        {
          label: 'Install App',
          description: 'Install as app to enable notifications',
          action: () => {
            // Show PWA installation guide
            showIOSInstallationGuide();
          }
        }
      ];
    
    case IOSPushErrorCategory.SERVICE_WORKER_REGISTRATION_FAILED:
      return [
        {
          label: 'Reload App',
          description: 'Reload the application to try again',
          action: () => window.location.reload()
        },
        {
          label: 'Clear Cache',
          description: 'Clear browser cache and try again',
          action: () => {
            alert('To clear your browser cache:\n1. Go to iOS Settings > Safari\n2. Tap "Clear History and Website Data"\n3. Return to this app and try again');
          }
        }
      ];
    
    case IOSPushErrorCategory.SERVICE_WORKER_TIMEOUT:
      return [
        {
          label: 'Try Again',
          description: 'Attempt the request again',
          action: () => window.location.reload()
        },
        {
          label: 'Check Connection',
          description: 'Verify network connection is stable',
          action: () => {
            alert('Please check that you have a stable internet connection and try again.');
          }
        }
      ];
    
    case IOSPushErrorCategory.TOKEN_ACQUISITION_FAILED:
      return [
        {
          label: 'Try Again',
          description: 'Attempt the request again',
          action: () => window.location.reload()
        },
        {
          label: 'Reset Permissions',
          description: 'Reset and request permissions again',
          action: () => {
            localStorage.removeItem('ios-push-flow-state');
            localStorage.removeItem('ios-push-flow-data');
            window.location.reload();
          }
        }
      ];
    
    case IOSPushErrorCategory.TOKEN_EXPIRED:
      return [
        {
          label: 'Refresh Token',
          description: 'Request a new notification token',
          action: () => window.location.reload()
        }
      ];
    
    case IOSPushErrorCategory.UNSUPPORTED_IOS_VERSION:
      return [
        {
          label: 'Update iOS',
          description: 'Update your iOS to version 16.4 or higher',
          action: () => {
            alert('To enable web push notifications, please update your iOS to version 16.4 or higher.');
          }
        }
      ];
    
    case IOSPushErrorCategory.NETWORK_ERROR:
      return [
        {
          label: 'Check Connection',
          description: 'Verify network connection is stable',
          action: () => {
            alert('Please check that you have a stable internet connection and try again.');
          }
        },
        {
          label: 'Try Again',
          description: 'Attempt the request again',
          action: () => window.location.reload()
        }
      ];
    
    case IOSPushErrorCategory.UNKNOWN:
    default:
      return [
        {
          label: 'Reload App',
          description: 'Reload the application to try again',
          action: () => window.location.reload()
        },
        {
          label: 'Contact Support',
          description: 'Get help from support team',
          action: () => {
            window.location.href = '/support';
          }
        }
      ];
  }
};

/**
 * Classify an error based on its message and context
 */
export const classifyIOSPushError = (error: unknown, context?: Record<string, any>): ClassifiedError => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // iOS version check
  if (errorMessage.includes('iOS version') || 
      errorMessage.includes('16.4') || 
      context?.iosVersion) {
    const category = IOSPushErrorCategory.UNSUPPORTED_IOS_VERSION;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: `iOS version ${context?.iosVersion || 'unknown'} is not supported`,
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // PWA check
  if (errorMessage.includes('PWA') || 
      errorMessage.includes('standalone') || 
      errorMessage.includes('install')) {
    const category = IOSPushErrorCategory.NOT_PWA_INSTALLED;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: 'Application not installed as PWA',
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Permission denial
  if (errorMessage.includes('denied') || 
      errorMessage.includes('Permission denied') ||
      context?.permission === 'denied') {
    const category = IOSPushErrorCategory.PERMISSION_DENIED;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: 'User denied permission request',
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Permission prompt closed
  if (errorMessage.includes('closed') || 
      errorMessage.includes('dismissed') ||
      context?.permission === 'default') {
    const category = IOSPushErrorCategory.PERMISSION_PROMPT_CLOSED;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: 'Permission prompt was closed without selection',
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Service worker issues
  if (errorMessage.includes('service worker') || 
      errorMessage.includes('registration')) {
    const category = IOSPushErrorCategory.SERVICE_WORKER_REGISTRATION_FAILED;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: `Service worker registration failed: ${errorMessage}`,
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Service worker timeout
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('timed out')) {
    const category = IOSPushErrorCategory.SERVICE_WORKER_TIMEOUT;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: `Service worker operation timed out: ${errorMessage}`,
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Token issues
  if (errorMessage.includes('token') || 
      errorMessage.includes('FCM') || 
      errorMessage.includes('messaging')) {
    const category = IOSPushErrorCategory.TOKEN_ACQUISITION_FAILED;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: `Token acquisition failed: ${errorMessage}`,
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Network issues
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('connection')) {
    const category = IOSPushErrorCategory.NETWORK_ERROR;
    
    return {
      category,
      userMessage: getUserMessageForError(category),
      technicalDetails: `Network error: ${errorMessage}`,
      recoveryActions: getRecoveryActions(category)
    };
  }
  
  // Default case - unknown error
  const category = IOSPushErrorCategory.UNKNOWN;
  return {
    category,
    userMessage: getUserMessageForError(category),
    technicalDetails: String(error),
    recoveryActions: getRecoveryActions(category)
  };
};

/**
 * Log a classified error with context
 */
export const logClassifiedError = (classified: ClassifiedError, originalError?: unknown): void => {
  // Enhanced logging with iOS context
  iosPushLogger.logPermissionEvent(`error-${classified.category}`, {
    userMessage: classified.userMessage,
    technicalDetails: classified.technicalDetails,
    originalError: originalError instanceof Error ? originalError.message : String(originalError),
    recoveryOptions: classified.recoveryActions.map(action => action.label)
  });
};
