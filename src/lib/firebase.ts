
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from "firebase/auth";

// Import the ensureFirebaseInitialized function from the index file
import { ensureFirebaseInitialized } from "./firebase/index";
import { getFirestoreInstance } from "./firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9CRFtt-AaGZ-yVpPdOBaTRzmdi73MMu8",
  authDomain: "tempowizard-ac888.firebaseapp.com",
  projectId: "tempowizard-ac888",
  storageBucket: "tempowizard-ac888.firebasestorage.app",
  messagingSenderId: "773638364697",
  appId: "1:773638364697:web:bb37937aefdf2985a25488",
  measurementId: "G-WW90RJ28BH"
};

// Firebase initialization
let firebaseApp: FirebaseApp;
let firebaseInitError: Error | null = null;

try {
  const apps = getApps();
  if (apps.length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
  } else {
    firebaseApp = apps[0];
    console.log("Using existing Firebase app");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  firebaseInitError = error instanceof Error ? error : new Error(String(error));
}

// Function to help generate the correct index creation URL
export const getFirestoreIndexCreationUrl = (collectionId: string, fields: string[]) => {
  if (!firebaseApp?.options?.projectId) {
    return null;
  }
  
  const projectId = firebaseApp.options.projectId;
  const encodedFields = encodeURIComponent(JSON.stringify(fields));
  
  return `https://console.firebase.google.com/project/${projectId}/firestore/indexes?create_composite=${encodedFields}&collection=${collectionId}`;
};

// Helper to detect if there's a missing index
export const isMissingIndexError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || String(error);
    
  return errorMessage.includes('index') && 
    errorMessage.includes('required') || 
    errorMessage.includes('9 FAILED_PRECONDITION');
};

// Check Firebase initialization status
export const isFirebaseInitialized = () => {
  return !!firebaseApp && !firebaseInitError;
};

export const getFirebaseInitError = () => {
  return firebaseInitError;
};

// Auth functions
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Add scopes for Google provider (optional but recommended for more data)
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Set custom parameters for a better UX
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Ping Firebase to verify connection
export const pingFirebase = async () => {
  try {
    if (!isFirebaseInitialized()) {
      return { success: false, error: getFirebaseInitError() };
    }
    
    // Simple ping by getting current user (doesn't make an actual network request)
    const currentUser = auth.currentUser;
    console.log("Firebase ping successful, current user:", currentUser?.email || "none");
    
    return { success: true };
  } catch (error) {
    console.error("Firebase ping failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign in with email failed:", error);
    return { user: null, error };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name
      });
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign up with email failed:", error);
    return { user: null, error };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log("Starting Google sign in process...");
    const userCredential = await signInWithPopup(auth, googleProvider);
    console.log("Google sign in successful:", userCredential.user?.email);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error("Sign in with Google failed:", error);
    // Log detailed error information for debugging
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
    if (error.customData) {
      console.error("Error custom data:", error.customData);
    }
    return { user: null, error };
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    console.error("Sign out failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};

// Monitor online status
export const setupNetworkMonitoring = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// Export constants for use in other modules
export const REMINDERS_COLLECTION = 'reminders';
export const USERS_COLLECTION = 'users';
export const PERIODS_COLLECTION = 'periods';

// Export firebaseApp for use in other modules
export { firebaseApp, ensureFirebaseInitialized, getFirestoreInstance };
