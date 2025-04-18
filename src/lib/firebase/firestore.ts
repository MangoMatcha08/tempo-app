
import {
  getFirestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  Timestamp,
  DocumentData,
  FirestoreError
} from "firebase/firestore";
import { firebaseApp } from "./config";

// Firestore status tracking
let firestoreInitialized = false;
let firestoreInstance = null;

// Get Firestore instance with init check
export const getFirestoreInstance = () => {
  if (!firebaseApp) {
    throw new Error("Firebase not initialized");
  }
  
  // Return existing instance if already initialized
  if (firestoreInstance) {
    return firestoreInstance;
  }
  
  const db = getFirestore(firebaseApp);
  firestoreInstance = db;
  
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

// Enhanced error handling for Firestore
export const handleFirestoreError = (error: FirestoreError | Error): { message: string, isIndexError: boolean, indexUrl?: string } => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isIndexError = errorMessage.includes('index') && errorMessage.includes('required');
  
  // Extract the index URL if this is an index error
  let indexUrl = null;
  if (isIndexError) {
    // Try to extract the URL from the error message
    const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com\/[^\s"]+/);
    indexUrl = urlMatch ? urlMatch[0] : null;
  }
  
  return { 
    message: errorMessage,
    isIndexError,
    indexUrl: indexUrl || undefined
  };
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

// Safely process Firestore documents with error handling
export const safeProcessDocument = <T>(
  doc: DocumentData | null | undefined, 
  transformer?: (data: any) => T
): T | null => {
  if (!doc || !doc.exists || !doc.data) {
    return null;
  }
  
  try {
    const data = doc.data();
    if (!data) return null;
    
    // Add id to the data
    const processedData = {
      ...data,
      id: doc.id
    };
    
    // Apply custom transformer if provided
    if (transformer) {
      return transformer(processedData);
    }
    
    return processedData as unknown as T;
  } catch (error) {
    console.error("Error processing Firestore document:", error);
    return null;
  }
};

export { Timestamp };
