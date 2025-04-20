
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from './config';

// Initialize Firebase Functions
export const initializeFunctions = () => {
  try {
    // Get Functions instance with explicit region
    const functions = getFunctions(firebaseApp, "us-central1");
    
    // Connect to emulator if in development
    if (process.env.NODE_ENV === 'development') {
      try {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('Connected to Firebase Functions emulator');
      } catch (err) {
        console.warn('Failed to connect to Functions emulator:', err);
      }
    }
    
    console.log('Firebase Functions initialized');
    return functions;
  } catch (error) {
    console.error('Error initializing Firebase Functions:', error);
    throw error;
  }
};

// Cache the functions instance
let functionsInstance = null;

// Get the Functions instance (initializing if needed)
export const getFunctionsInstance = () => {
  if (!functionsInstance) {
    functionsInstance = initializeFunctions();
  }
  return functionsInstance;
};

// Helper to ensure user is authenticated before calling functions
const ensureAuthenticated = async () => {
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error("No authenticated user found when calling function");
    throw new Error("Authentication required to call functions");
  }
  
  // Refresh the ID token to ensure it's valid
  try {
    await auth.currentUser.getIdToken(true);
    return true;
  } catch (error) {
    console.error("Error refreshing authentication token:", error);
    throw error;
  }
};

// Call a specific Cloud Function with authentication check
export const callFunction = async (name: string, data?: any) => {
  try {
    // Ensure authentication before proceeding
    await ensureAuthenticated();
    
    const functionsInstance = getFunctionsInstance();
    console.log(`Calling function ${name} with authenticated user:`, getAuth().currentUser?.uid);
    
    const functionRef = httpsCallable(functionsInstance, name);
    const result = await functionRef(data || {});
    return result.data;
  } catch (error) {
    console.error(`Error calling Firebase function ${name}:`, error);
    
    // Add detailed logging for debugging
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.details) {
      console.error("Error details:", error.details);
    }
    
    throw error;
  }
};

// Send test notification using callable function
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
    return await callFunction('sendTestNotification', data);
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw error;
  }
};

// Re-export the Firebase Functions types/methods that we need
export { httpsCallable };

// Initialize on module load
getFunctionsInstance();
