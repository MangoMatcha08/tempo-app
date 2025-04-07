
// Export all Firebase functionality from one central file
export * from './config';
export * from './auth';
export * from './firestore';
export * from './indexing';
export * from './network';
export * from './functions';

// Prevent multiple initializations
let isFirebaseInitialized = false;

// Perform initialization only once
export const ensureFirebaseInitialized = () => {
  if (!isFirebaseInitialized) {
    console.log('Firebase module initialized');
    isFirebaseInitialized = true;
  }
  return isFirebaseInitialized;
};

// Initialize immediately
ensureFirebaseInitialized();
