
// Re-export core functionality
export * from './core/initialization';
export * from './core/messaging';

// Re-export storage functionality
export { saveTokenToFirestore } from './storage/token';

// Initialize Firebase when this module is loaded
import { initializeFirebase } from './core/initialization';
export const firebaseInitPromise = initializeFirebase().catch(err => {
  console.error('Failed to initialize Firebase:', err);
  return false;
});

// Export default object with consistent naming
export default {
  requestNotificationPermission,
  saveTokenToFirestore,
  setupForegroundMessageListener,
  firebaseInitPromise
};
