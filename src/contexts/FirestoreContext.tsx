
import { createContext, useContext, ReactNode, useEffect, useState, useMemo } from "react";
import { isFirebaseInitialized } from "@/lib/firebase";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  Firestore, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { ScheduleProvider } from "./ScheduleContext";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/services/notifications/firebase";

interface FirestoreContextType {
  isReady: boolean;
  db: Firestore | null;
  error: Error | null;
}

const FirestoreContext = createContext<FirestoreContextType>({
  isReady: false,
  db: null,
  error: null
});

export const FirestoreProvider = ({ children }: { children: ReactNode }) => {
  const isReady = isFirebaseInitialized();
  const [db, setDb] = useState<Firestore | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Initialize Firestore with optimized persistent cache
  useEffect(() => {
    if (!isReady) return;
    
    let isMounted = true;
    console.log("Initializing Firestore...");
    
    const initFirestore = async () => {
      try {
        // Attempt to initialize with modern optimized settings
        let firestore: Firestore;
        
        try {
          // Use modern persistent cache with multi-tab support
          firestore = initializeFirestore(app, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED,
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            })
          });
          console.log("Initialized Firestore with optimized persistent cache");
        } catch (err) {
          console.warn("Could not initialize with enhanced settings, falling back:", err);
          
          firestore = getFirestore(app);
          
          // Try to enable persistence with older method
          try {
            await enableIndexedDbPersistence(firestore);
            console.log("Firestore persistence enabled with fallback method");
          } catch (persistErr: any) {
            if (persistErr.code === 'failed-precondition') {
              console.warn("Multiple tabs open, persistence can only be enabled in one tab");
              // This is not a fatal error, we can continue
            } else if (persistErr.code === 'unimplemented') {
              console.warn("Persistence not available in this browser");
              // This is not a fatal error, we can continue
            } else {
              console.error("Error enabling persistence:", persistErr);
              if (isMounted) setError(persistErr);
            }
          }
        }
        
        // Set the database instance even if there were non-fatal errors with persistence
        if (isMounted) setDb(firestore);
        console.log("Firestore initialized successfully");
        
        // Show additional information about Firestore API activation
        toast({
          title: "Firebase Connection Info",
          description: "For this demo, you're seeing demo data. For full Firestore functionality, activate the Firestore API in the Firebase console.",
        });
      } catch (error: any) {
        console.error("Error initializing Firestore:", error);
        if (isMounted) setError(error);
        toast({
          title: "Database Error",
          description: "Failed to initialize the database. Using mock data instead.",
          variant: "destructive",
        });
      }
    };
    
    initFirestore();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [isReady, toast]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isReady,
    db,
    error
  }), [isReady, db, error]);
  
  return (
    <FirestoreContext.Provider value={contextValue}>
      <ScheduleProvider>
        {children}
      </ScheduleProvider>
    </FirestoreContext.Provider>
  );
};

export const useFirestore = () => useContext(FirestoreContext);
