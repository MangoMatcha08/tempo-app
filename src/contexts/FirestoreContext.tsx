
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { firebaseApp, getFirestoreInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface FirestoreContextType {
  db: Firestore | null;
  isReady: boolean;
  error: Error | null;
  isOnline: boolean;
}

const FirestoreContext = createContext<FirestoreContextType>({
  db: null,
  isReady: false,
  error: null,
  isOnline: true
});

export const useFirestore = () => useContext(FirestoreContext);

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Set up network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "You are now connected to the internet.",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "The app will continue to work with locally cached data.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    try {
      // Initialize Firestore with optimized settings
      const firestoreInstance = getFirestoreInstance();
      
      // If no error was thrown, Firestore is ready
      setDb(firestoreInstance);
      setIsReady(true);
      setError(null);
      
      console.log('Firestore initialized successfully in context');
    } catch (err) {
      console.error('Error initializing Firestore in context:', err);
      setError(err instanceof Error ? err : new Error('Unknown Firestore error'));
      // Still set db to avoid null checks throughout the app
      // This will allow the app to gracefully handle Firestore errors
      try {
        const firestoreInstance = getFirestoreInstance();
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
    error,
    isOnline
  }), [db, isReady, error, isOnline]);

  return (
    <FirestoreContext.Provider value={contextValue}>
      {children}
    </FirestoreContext.Provider>
  );
};
