
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { firebaseApp } from './config';

let functionsInitialized = false;
let functions: any = null;

// Initialize Firebase Functions
export const initializeFunctions = () => {
  if (functionsInitialized || !firebaseApp) return;
  
  try {
    // Get Functions instance
    functions = getFunctions(firebaseApp);
    
    // Connect to emulator if in development
    if (process.env.NODE_ENV === 'development') {
      try {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('Connected to Firebase Functions emulator');
      } catch (err) {
        console.warn('Failed to connect to Functions emulator:', err);
      }
    }
    
    functionsInitialized = true;
    console.log('Firebase Functions initialized');
  } catch (error) {
    console.error('Error initializing Firebase Functions:', error);
  }
};

// Get the Functions instance (initializing if needed)
export const getFunctionsInstance = () => {
  if (!functionsInitialized) {
    initializeFunctions();
  }
  return functions;
};

// Call a specific Cloud Function
export const callFunction = async (name: string, data?: any) => {
  const functionsInstance = getFunctionsInstance();
  if (!functionsInstance) {
    throw new Error('Firebase Functions not initialized');
  }
  
  try {
    const functionRef = httpsCallable(functionsInstance, name);
    const result = await functionRef(data || {});
    return result.data;
  } catch (error) {
    console.error(`Error calling Firebase function ${name}:`, error);
    throw error;
  }
};

// Specific function calls
export const sendTestNotification = async (options: {
  type?: 'push' | 'email';
  email?: string;
  includeDeviceInfo?: boolean;
} = {}) => {
  const { type = 'push', email, includeDeviceInfo = true } = options;
  
  // Get device info if requested
  let deviceInfo = {};
  if (includeDeviceInfo) {
    try {
      // Basic device information that's safe to collect
      deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        pixelRatio: window.devicePixelRatio,
        vendor: navigator.vendor || 'unknown',
      };
      
      // For push notifications, we can add extra diagnostic info
      // but we need to be careful about imports to avoid runtime errors
      if (type === 'push') {
        // Instead of dynamic imports which can cause path resolution issues,
        // we'll safely check for notification permissions without importing
        if ('Notification' in window) {
          Object.assign(deviceInfo, {
            notificationPermission: Notification.permission,
            serviceWorkerSupported: 'serviceWorker' in navigator,
            serviceWorkerStatus: navigator.serviceWorker?.controller ? 'controlled' : 'not-controlled'
          });
        }
      }
    } catch (e) {
      // If device info collection fails, provide a simple fallback
      deviceInfo = {
        error: 'Failed to collect device info',
        errorMessage: e instanceof Error ? e.message : String(e)
      };
    }
  }

  // Add email if provided
  const data: any = {
    type,
    ...deviceInfo
  };

  if (type === 'email' && email) {
    data.email = email;
  }

  try {
    return await callFunction('sendTestNotification', data);
  } catch (error) {
    // Create a more descriptive error for the UI
    const contextualError = new Error(
      error instanceof Error 
        ? `Failed to send ${type} notification: ${error.message}`
        : `Failed to send ${type} notification: ${String(error)}`
    );
    
    // Preserve error properties if available
    if (error instanceof Error) {
      Object.assign(contextualError, error);
    }
    
    throw contextualError;
  }
};

// Helper function for explicit reminder notification
export const sendReminderNotification = async (
  reminderId: string,
  notificationType: string
) => {
  return await callFunction('sendReminderNotification', {
    reminderId,
    notificationType
  });
};

// Re-export the Firebase Functions types/methods that we need
export { httpsCallable };

// Initialize on module load
initializeFunctions();
