
// Re-export core functionality
export * from './core/initialization';
export * from './core/messaging';

// Re-export storage functionality
export { saveTokenToFirestore } from './storage/token';

// Initialize Firebase when this module is loaded
import { initializeFirebase } from './core/initialization';
import { requestNotificationPermission, setupForegroundMessageListener } from './core/messaging';
import { saveTokenToFirestore } from './storage/token';

export const firebaseInitPromise = initializeFirebase().catch(err => {
  console.error('Failed to initialize Firebase:', err);
  return false;
});

// Export default object with explicit property assignments
export default {
  requestNotificationPermission: requestNotificationPermission,
  saveTokenToFirestore: saveTokenToFirestore,
  setupForegroundMessageListener: setupForegroundMessageListener,
  firebaseInitPromise
};
