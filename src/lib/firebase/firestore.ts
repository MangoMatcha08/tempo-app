
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  Timestamp
} from "firebase/firestore";
import { firebaseApp } from "./config";
import { toFirestoreTimestamp, fromFirestoreTimestamp } from "./dateConversions";

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

/**
 * Utility to help with Firestore document conversion
 * This ensures all timestamps are converted to PST dates
 */
export const convertTimestampFields = <T extends Record<string, any>>(data: T): T => {
  if (!data) return data;
  
  const result = { ...data };
  
  for (const key in result) {
    // Use type assertions to safely check instance types
    if (result[key] && typeof result[key] === 'object' && 'toDate' in result[key] && typeof result[key].toDate === 'function') {
      (result as any)[key] = fromFirestoreTimestamp(result[key]);
    }
  }
  
  return result;
};

/**
 * Utility to prepare data for Firestore by converting dates to Timestamps
 */
export const prepareForFirestore = <T extends Record<string, any>>(data: T, dateFields: string[] = ['createdAt', 'updatedAt', 'dueDate', 'completedAt']): T => {
  if (!data) return data;
  
  const result = { ...data };
  
  for (const key of dateFields) {
    const value = result[key as keyof T];
    if (value) {
      if (value && typeof value === 'object' && Object.prototype.toString.call(value) === '[object Date]') {
        (result as any)[key] = toFirestoreTimestamp(value as Date);
      } else if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          (result as any)[key] = toFirestoreTimestamp(date);
        }
      }
    }
  }
  
  return result;
};

export { Timestamp, toFirestoreTimestamp, fromFirestoreTimestamp };
