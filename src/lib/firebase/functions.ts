
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { firebaseApp } from './config';

let functionsInitialized = false;
let functions: any = null;
let isEmulator = false;

// Initialize Firebase Functions with improved emulator detection
export const initializeFunctions = () => {
  if (functionsInitialized || !firebaseApp) return;
  
  try {
    // Get Functions instance
    functions = getFunctions(firebaseApp);
    
    // Connect to emulator if in development or explicitly requested
    if (process.env.NODE_ENV === 'development' || process.env.VITE_USE_EMULATORS === 'true') {
      try {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('Connected to Firebase Functions emulator on localhost:5001');
        isEmulator = true;
      } catch (err) {
        console.warn('Failed to connect to Functions emulator:', err);
      }
    }
    
    functionsInitialized = true;
    console.log(`Firebase Functions initialized (${isEmulator ? 'emulator mode' : 'production mode'})`);
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

// Check if we're using the emulator
export const isUsingEmulator = () => {
  return isEmulator;
};

// Call a specific Cloud Function with improved error handling and debugging
export const callFunction = async (name: string, data?: any) => {
  const functionsInstance = getFunctionsInstance();
  if (!functionsInstance) {
    throw new Error('Firebase Functions not initialized');
  }
  
  try {
    console.log(`Calling Firebase function "${name}" with data:`, data);
    console.log(`Using ${isEmulator ? 'emulator' : 'production'} environment`);
    
    const functionRef = httpsCallable(functionsInstance, name);
    const result = await functionRef(data || {});
    
    console.log(`Function "${name}" returned:`, result.data);
    return result.data;
  } catch (error: any) {
    // Enhanced error reporting
    console.error(`Error calling Firebase function "${name}":`, error);
    
    // Create a more descriptive error for debugging
    const enhancedError = new Error(
      `Firebase function "${name}" failed: ${error?.message || 'Unknown error'}`
    );
    
    // Add Firebase specific error details if available
    if (error?.details) {
      Object.assign(enhancedError, { 
        details: error.details,
        code: error.code,
        functionName: name
      });
    }
    
    throw enhancedError;
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
    ...deviceInfo,
    emulatorMode: isEmulator  // Add flag to indicate if running in emulator
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

// Test function to validate emulator connection
export const testEmulatorConnection = async (): Promise<{ success: boolean; isEmulator: boolean; message: string }> => {
  try {
    const response = await callFunction('testEmulatorConnection', { timestamp: Date.now() });
    return {
      success: true,
      isEmulator,
      message: `Successfully connected to ${isEmulator ? 'emulator' : 'production'}`
    };
  } catch (error) {
    return {
      success: false,
      isEmulator,
      message: `Failed to connect to Firebase Functions: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Re-export the Firebase Functions types/methods that we need
export { httpsCallable };

// Initialize on module load
initializeFunctions();
