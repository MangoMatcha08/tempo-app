
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
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

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
let firestoreInitialized = false;

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

// Initialize Firestore with persistence settings
const initializeFirestoreWithSettings = async () => {
  if (firestoreInitialized) {
    return;
  }

  try {
    // Initialize Firestore with multi-tab persistence
    const db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        tabManager: persistentMultipleTabManager()
      })
    });

    // Enable offline persistence
    // Note: This is only needed for older Firebase versions, newer ones use the settings above
    try {
      await enableIndexedDbPersistence(db);
      console.log('Firestore persistence enabled successfully');
    } catch (err: any) {
      // These errors are normal in certain circumstances and can be ignored
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed - multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
      } else {
        console.error('Error enabling Firestore persistence:', err);
      }
    }
    
    firestoreInitialized = true;
    console.log('Firestore initialization complete');
    
  } catch (error) {
    console.error('Error setting up Firestore:', error);
  }
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

// Check Firebase initialization status
export const isFirebaseInitialized = () => {
  return !!firebaseApp && !firebaseInitError;
};

export const getFirebaseInitError = () => {
  return firebaseInitError;
};

// Get Firestore instance with init check
export const getFirestoreInstance = () => {
  if (!isFirebaseInitialized()) {
    throw new Error("Firebase not initialized");
  }
  
  const db = getFirestore(firebaseApp);
  
  // Initialize persistence settings in the background
  initializeFirestoreWithSettings().catch(err => {
    console.error("Error initializing Firestore persistence:", err);
  });
  
  return db;
};

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

// Export firebaseApp for use in other modules
export { firebaseApp };
