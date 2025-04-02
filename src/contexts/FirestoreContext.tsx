
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Firestore } from 'firebase/firestore';
import { firebaseApp, getFirestoreInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isMissingIndexError, getFirestoreIndexCreationUrl } from '@/lib/firebase/indexing';

interface FirestoreContextType {
  db: Firestore | null;
  isReady: boolean;
  error: Error | null;
  isOnline: boolean;
  hasFirestorePermissions: boolean;
  useMockData: boolean;
  indexesNeeded: Record<string, boolean>;
}

const FirestoreContext = createContext<FirestoreContextType>({
  db: null,
  isReady: false,
  error: null,
  isOnline: true,
  hasFirestorePermissions: true,
  useMockData: false,
  indexesNeeded: {}
});

export const useFirestore = () => useContext(FirestoreContext);

export const FirestoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasFirestorePermissions, setHasFirestorePermissions] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [indexesNeeded, setIndexesNeeded] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Determine if the current user is a test account
  const isTestAccount = useMemo(() => {
    if (!user) return false;
    return user.email === 'test@example.com';
  }, [user]);

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
      
      // Log the project ID to verify configuration
      console.log('Firestore project ID:', firebaseApp?.options?.projectId || 'unknown');
      
      // If no error was thrown, Firestore is ready
      setDb(firestoreInstance);
      setIsReady(true);
      setError(null);
      
      console.log('Firestore initialized successfully in context');
    } catch (err) {
      console.error('Error initializing Firestore in context:', err);
      setError(err instanceof Error ? err : new Error('Unknown Firestore error'));
      
      // Check if this is a permissions error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('permission-denied') || 
          errorMessage.includes('not been used') || 
          errorMessage.includes('disabled')) {
        console.warn('Firestore permissions issue detected');
        setHasFirestorePermissions(false);
        
        // Only use mock data for test accounts when there's a permissions issue
        if (isTestAccount) {
          setUseMockData(true);
          toast({
            title: "Test Account Mode",
            description: "Using mock data for test account.",
            duration: 6000,
          });
        } else {
          toast({
            title: "Firestore Access Issue",
            description: "Firebase Firestore API may need to be enabled in your project.",
            duration: 6000,
            variant: "destructive"
          });
        }
      } else if (isMissingIndexError(err)) {
        // Check if this is an index error
        console.warn('Firestore index issue detected');
        toast({
          title: "Firestore Index Required",
          description: "Create the necessary indexes in the Firebase Console.",
          duration: 8000,
        });
        
        // Still set the database reference
        setDb(firestoreInstance);
      }
      
      // Still set db to avoid null checks throughout the app
      // This will allow the app to gracefully handle Firestore errors
      try {
        const firestoreInstance = getFirestoreInstance();
        setDb(firestoreInstance);
      } catch (e) {
        console.error('Critical error getting Firestore instance:', e);
      }
    }
  }, [toast, isTestAccount]);

  // Method to register a needed index
  const registerNeededIndex = (collectionId: string, fields: string[]) => {
    setIndexesNeeded(prev => ({ ...prev, [collectionId]: true }));
    
    // Generate the URL for creating the index
    const indexUrl = getFirestoreIndexCreationUrl(collectionId, fields);
    if (indexUrl) {
      console.info(`Create index at: ${indexUrl}`);
      toast({
        title: "Firestore Index Required",
        description: `Create the necessary index for ${collectionId} collection to improve performance.`,
        duration: 8000,
      });
    }
  };

  // Memoize the context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    db,
    isReady,
    error,
    isOnline,
    hasFirestorePermissions,
    useMockData,
    indexesNeeded
  }), [db, isReady, error, isOnline, hasFirestorePermissions, useMockData, indexesNeeded]);

  return (
    <FirestoreContext.Provider value={contextValue}>
      {children}
    </FirestoreContext.Provider>
  );
};

