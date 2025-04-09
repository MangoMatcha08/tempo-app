
// Firebase initialization and configuration
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { browserDetection } from '@/utils/browserDetection';
import { iosPushLogger } from '@/utils/iosPushLogger';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB9CRFtt-AaGZ-yVpPdOBaTRzmdi73MMu8',
  authDomain: 'tempowizard-ac888.firebaseapp.com',
  projectId: 'tempowizard-ac888',
  storageBucket: 'tempowizard-ac888.firebasestorage.app',
  messagingSenderId: '773638364697',
  appId: '1:773638364697:web:bb37937aefdf2985a25488',
  measurementId: 'G-WW90RJ28BH'
};

// FCM Vapid Key - Ensure no padding for iOS
export const vapidKey = 'BJ9HWzAxfk1jKtkGfoKYMauaVfMatIkqw0cCEwQ1WBH7cn5evFO_saWfpvXAVy5710DTOpSUoXsKk8LWGQK7lBU';

// Initialize Firebase
let messaging: any = null;
let firestore: any = null;
let firebaseInitialized = false;
let app: any = null;

// Safely initialize Firebase only in browser environment
export const initializeFirebase = async () => {
  if (firebaseInitialized) return { messaging, firestore };
  
  if (typeof window !== 'undefined') {
    try {
      console.log('Initializing Firebase...');
      app = initializeApp(firebaseConfig);
      
      // Check if messaging is supported
      const supported = await isSupported();
      if (supported) {
        try {
          messaging = getMessaging(app);
          console.log('Firebase messaging initialized');
        } catch (messagingError) {
          console.error('Error initializing Firebase messaging:', messagingError);
          messaging = null;
        }
      } else {
        console.log('Firebase messaging not supported in this browser');
      }
      
      // Initialize Firestore
      try {
        firestore = getFirestore(app);
        console.log('Firebase Firestore initialized');
      } catch (firestoreError) {
        console.error('Error initializing Firestore:', firestoreError);
        firestore = null;
      }
      
      firebaseInitialized = true;
      
      // Register service worker for push with iOS-specific handling
      if ('serviceWorker' in navigator) {
        try {
          // Log that we're starting service worker registration
          if (browserDetection.isIOS()) {
            iosPushLogger.logServiceWorkerEvent('registration-start', { 
              isIOS: true, 
              iosSafari: browserDetection.isIOSSafari() 
            });
          }
          
          // For iOS, we need to be explicit about the service worker and scope
          const swOptions = browserDetection.isIOS() ? 
            { scope: '/' } : 
            undefined;
          
          const existingSW = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          if (!existingSW) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', swOptions);
            console.log('Service worker registered:', registration);
            
            if (browserDetection.isIOS()) {
              iosPushLogger.logServiceWorkerEvent('registration-success', {
                scope: registration.scope,
                updateViaCache: registration.updateViaCache
              });
            }
          } else {
            console.log('Existing service worker found');
            
            if (browserDetection.isIOS()) {
              iosPushLogger.logServiceWorkerEvent('existing-found', {
                scope: existingSW.scope,
                state: existingSW.active?.state || 'unknown'
              });
              
              // Ensure the correct scope on iOS
              if (!existingSW.scope.endsWith('/')) {
                console.warn('Service worker scope is not root, this may cause issues on iOS');
                iosPushLogger.logServiceWorkerEvent('scope-warning', {
                  currentScope: existingSW.scope,
                  recommendedScope: '/'
                });
              }
            }
          }
        } catch (swError) {
          console.error('Service worker registration failed:', swError);
          
          if (browserDetection.isIOS()) {
            iosPushLogger.logServiceWorkerEvent('registration-failed', { 
              error: swError instanceof Error ? swError.message : String(swError)
            });
          }
        }
      }
      
      return { messaging, firestore };
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      
      if (browserDetection.isIOS()) {
        iosPushLogger.logPushEvent('firebase-init-error', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      return { messaging: null, firestore: null };
    }
  }
  
  return { messaging: null, firestore: null };
};

// Initialize Firebase when this module is loaded
initializeFirebase().catch(err => console.error('Failed to initialize Firebase:', err));

export { messaging, firestore, app };
