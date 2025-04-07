
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
export const sendTestNotification = async () => {
  return await callFunction('sendTestNotification');
};

// Re-export the Firebase Functions types/methods that we need
export { httpsCallable };

// Initialize on module load
initializeFunctions();
