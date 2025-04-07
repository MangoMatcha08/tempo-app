
import { initializeApp, getApps, FirebaseApp } from "firebase/app";

// Firebase configuration
export const firebaseConfig = {
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

// Utility functions to check Firebase initialization status
export const isFirebaseInitialized = () => {
  return !!firebaseApp && !firebaseInitError;
};

export const getFirebaseInitError = () => {
  return firebaseInitError;
};

// Export constants for use in other modules
export const REMINDERS_COLLECTION = 'reminders';
export const USERS_COLLECTION = 'users';
export const PERIODS_COLLECTION = 'periods';

// Export firebaseApp for use in other modules
export { firebaseApp };
