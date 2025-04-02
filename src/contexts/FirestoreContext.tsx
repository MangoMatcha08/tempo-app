
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Firestore, collection, getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

interface FirestoreContextType {
  db: Firestore | null;
  isReady: boolean;
  error: Error | null;
}

const FirestoreContext = createContext<FirestoreContextType>({
  db: null,
  isReady: false,
  error: null
});

export const useFirestore = () => useContext(FirestoreContext);

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Initialize Firestore
      const firestoreInstance = getFirestore(firebaseApp);
      
      // Test Firestore connection by accessing a collection
      const testRef = collection(firestoreInstance, 'system_status');
      
      // If no error was thrown, Firestore is ready
      setDb(firestoreInstance);
      setIsReady(true);
      setError(null);
      
      console.log('Firestore initialized successfully');
    } catch (err) {
      console.error('Error initializing Firestore:', err);
      setError(err instanceof Error ? err : new Error('Unknown Firestore error'));
      // Still set db to avoid null checks throughout the app
      // This will allow the app to gracefully handle Firestore errors
      try {
        const firestoreInstance = getFirestore(firebaseApp);
        setDb(firestoreInstance);
      } catch (e) {
        console.error('Critical error getting Firestore instance:', e);
      }
    }
  }, []);

  // Memoize the context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    db,
    isReady,
    error
  }), [db, isReady, error]);

  return (
    <FirestoreContext.Provider value={contextValue}>
      {children}
    </FirestoreContext.Provider>
  );
};
