
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { firebaseApp } from './config';

let functionsInitialized = false;
let functions: any = null;
let initError: Error | null = null;

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
    initError = error instanceof Error ? error : new Error(String(error));
  }
};

// Get the Functions instance (initializing if needed)
export const getFunctionsInstance = () => {
  if (!functionsInitialized) {
    initializeFunctions();
  }
  return functions;
};

// Check if Firebase Functions are available
export const areFunctionsAvailable = () => {
  return functionsInitialized && functions !== null;
};

// Get initialization error if any
export const getFunctionsError = () => {
  return initError;
};

// Call a specific Cloud Function with improved error handling
export const callFunction = async (name: string, data?: any) => {
  const functionsInstance = getFunctionsInstance();
  if (!functionsInstance) {
    const errorMsg = initError ? initError.message : 'Firebase Functions not initialized';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    console.log(`Calling Firebase function ${name} with data:`, data || {});
    const functionRef = httpsCallable(functionsInstance, name);
    const result = await functionRef(data || {});
    console.log(`Function ${name} returned:`, result.data);
    return result.data;
  } catch (error) {
    console.error(`Error calling Firebase function ${name}:`, error);
    
    // Enhanced error information
    const enhancedError = new Error(
      error instanceof Error 
        ? `Firebase function ${name} error: ${error.message}`
        : `Firebase function ${name} error: ${String(error)}`
    );
    
    // Add Firebase-specific error details if available
    if (error && typeof error === 'object' && 'code' in error) {
      (enhancedError as any).code = (error as any).code;
      (enhancedError as any).details = (error as any).details;
      
      // Interpret common Firebase error codes
      switch ((error as any).code) {
        case 'functions/internal':
          console.error('Internal server error in Firebase function. Check Firebase console logs.');
          break;
        case 'functions/resource-exhausted':
          console.error('Firebase function quota exceeded. Check your billing plan.');
          break;
        case 'functions/unavailable':
          console.error('Firebase function service is currently unavailable.');
          break;
      }
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
  let deviceInfo: any = {};
  if (includeDeviceInfo) {
    try {
      deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        pixelRatio: window.devicePixelRatio,
        vendor: navigator.vendor,
        appVersion: navigator.appVersion
      };
      
      // Add Firebase messaging token status
      if (type === 'push') {
        try {
          const { getMessagingStatus } = await import('../services/messaging/messagingService');
          deviceInfo.messagingStatus = getMessagingStatus();
        } catch (e) {
          deviceInfo.messagingStatusError = e instanceof Error ? e.message : String(e);
        }
      }
    } catch (e) {
      deviceInfo = { error: 'Failed to collect device info' };
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
    // Add additional context to the error
    const contextualError = new Error(
      error instanceof Error 
        ? `Failed to send ${type} notification: ${error.message}` 
        : `Failed to send ${type} notification: ${String(error)}`
    );
    
    // Copy any properties from the original error
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
