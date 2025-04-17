
import { iosPushLogger } from './iosPushLogger';
import { browserDetection } from './browserDetection';

export enum TokenErrorType {
  NETWORK = 'network',
  PERMISSION = 'permission',
  SERVICE_WORKER = 'service-worker',
  INITIALIZATION = 'initialization',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

interface TokenError {
  type: TokenErrorType;
  message: string;
  recoverable: boolean;
  code?: string;
  context?: Record<string, any>;
}

/**
 * Classify token acquisition errors
 */
export function classifyTokenError(error: any): TokenError {
  // Firebase messaging errors
  if (error.code?.startsWith('messaging/')) {
    switch (error.code) {
      case 'messaging/token-request-failed':
        return {
          type: TokenErrorType.NETWORK,
          message: 'Failed to request notification token',
          recoverable: true,
          code: error.code
        };
      case 'messaging/permission-blocked':
        return {
          type: TokenErrorType.PERMISSION,
          message: 'Notification permission denied',
          recoverable: false,
          code: error.code
        };
      default:
        return {
          type: TokenErrorType.UNKNOWN,
          message: error.message,
          recoverable: true,
          code: error.code
        };
    }
  }
  
  // Service worker errors
  if (error.message?.includes('service worker')) {
    return {
      type: TokenErrorType.SERVICE_WORKER,
      message: 'Service worker registration issue',
      recoverable: true,
      context: {
        isIOS: browserDetection.isIOS(),
        iosVersion: browserDetection.getIOSVersion()
      }
    };
  }
  
  // Default unknown error
  return {
    type: TokenErrorType.UNKNOWN,
    message: error instanceof Error ? error.message : String(error),
    recoverable: true
  };
}

/**
 * Log token error with context
 */
export function logTokenError(error: TokenError): void {
  iosPushLogger.logPushEvent('token-error', {
    ...error,
    timestamp: Date.now(),
    browser: navigator.userAgent,
    isIOS: browserDetection.isIOS(),
    iosVersion: browserDetection.getIOSVersion()
  });
}

/**
 * Get recovery guidance for token errors
 */
export function getErrorRecoverySteps(error: TokenError): string[] {
  switch (error.type) {
    case TokenErrorType.NETWORK:
      return [
        'Check your internet connection',
        'Try again in a few moments'
      ];
    case TokenErrorType.PERMISSION:
      return [
        'Open your browser settings',
        'Allow notifications for this site'
      ];
    case TokenErrorType.SERVICE_WORKER:
      return [
        'Refresh the page',
        'Clear browser cache if problem persists'
      ];
    default:
      return [
        'Try again',
        'Contact support if the problem continues'
      ];
  }
}
