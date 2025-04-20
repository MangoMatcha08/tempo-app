
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
    deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
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
    console.log("Sending test notification with data:", data);
    // Use httpsCallable which handles CORS correctly, instead of direct fetch
    return await callFunction('sendTestNotification', data);
  } catch (error) {
    console.error("Error sending test notification:", error);
    
    // Add more diagnostic information
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('network')) {
        console.error("This appears to be a CORS or network error. Make sure your Firebase function has CORS configured properly.");
      }
    }
    
    throw error;
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

// Add this near the end of the file
console.log("Auth current user:", getAuth().currentUser);
console.log("Functions initialized:", functionsInitialized);
console.log("Functions instance available:", !!functions);

// Re-export the Firebase Functions types/methods that we need
export { httpsCallable };

// Initialize on module load
initializeFunctions();
