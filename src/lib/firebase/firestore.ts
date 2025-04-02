
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Timestamp
} from "firebase/firestore";
import { firebaseApp } from "./config";

// Firestore status tracking
let firestoreInitialized = false;

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

// Get Firestore instance with init check
export const getFirestoreInstance = () => {
  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }
  
  const db = getFirestore(firebaseApp);
  
  // Initialize persistence settings in the background
  initializeFirestoreWithSettings().catch(err => {
    console.error("Error initializing Firestore persistence:", err);
  });
  
  return db;
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
