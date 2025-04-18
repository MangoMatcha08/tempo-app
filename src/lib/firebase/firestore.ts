
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  Timestamp
} from "firebase/firestore";
import { firebaseApp } from "./config";

// Firestore status tracking
let firestoreInitialized = false;

// Get Firestore instance with init check
export const getFirestoreInstance = () => {
  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }
  
  const db = getFirestore(firebaseApp);
  
  // Initialize persistence settings in the background
  initializeFirestoreWithSettings(db).catch(err => {
    console.error("Error initializing Firestore persistence:", err);
  });
  
  return db;
};

// Initialize Firestore with persistence settings
const initializeFirestoreWithSettings = async (db) => {
  if (firestoreInitialized) {
    return;
  }

  try {
    // Enable offline persistence
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

// Utility to help with Firestore document conversion
export const convertTimestampFields = (data: any, timestampFields: string[] = ['createdAt', 'updatedAt', 'dueDate', 'completedAt']) => {
  if (!data) return data;
  
  const result = { ...data };
  
  for (const field of timestampFields) {
    if (result[field] && typeof result[field].toDate === 'function') {
      result[field] = result[field].toDate();
    }
  }
  
  return result;
};

export { Timestamp };
