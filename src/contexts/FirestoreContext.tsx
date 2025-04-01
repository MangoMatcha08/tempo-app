
import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { isFirebaseInitialized } from "@/lib/firebase";
import { getFirestore, enableIndexedDbPersistence, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { ScheduleProvider } from "./ScheduleContext";
import { useToast } from "@/hooks/use-toast";

interface FirestoreContextType {
  isReady: boolean;
  db: Firestore | null;
}

const FirestoreContext = createContext<FirestoreContextType>({
  isReady: false,
  db: null
});

export const FirestoreProvider = ({ children }: { children: ReactNode }) => {
  const isReady = isFirebaseInitialized();
  const [db, setDb] = useState<Firestore | null>(null);
  const { toast } = useToast();
  
  // Initialize Firestore with offline persistence
  useEffect(() => {
    if (!isReady) return;
    
    const initFirestore = async () => {
      try {
        console.log("Initializing Firestore...");
        
        // Initialize Firestore with optimized settings
        let firestore: Firestore;
        
        try {
          // First try to initialize with enhanced cache
          firestore = initializeFirestore(window.firebase, {
            cacheSizeBytes: CACHE_SIZE_UNLIMITED
          });
          console.log("Initialized Firestore with unlimited cache size");
        } catch (err) {
          console.warn("Could not initialize with enhanced settings, using default:", err);
          firestore = getFirestore();
        }
        
        // Enable offline persistence
        try {
          await enableIndexedDbPersistence(firestore);
          console.log("Firestore offline persistence enabled");
        } catch (err: any) {
          if (err.code === 'failed-precondition') {
            console.warn("Firestore persistence could not be enabled: Multiple tabs open");
            // Multiple tabs open, persistence can only be enabled in one tab at a time
          } else if (err.code === 'unimplemented') {
            console.warn("Firestore persistence not available in this browser");
            // The current browser does not support all of the features required for persistence
          } else {
            console.error("Error enabling Firestore persistence:", err);
          }
        }
        
        setDb(firestore);
        console.log("Firestore initialized successfully");
      } catch (error) {
        console.error("Error initializing Firestore:", error);
        toast({
          title: "Database Error",
          description: "Failed to initialize the database. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    };
    
    initFirestore();
  }, [isReady, toast]);
  
  return (
    <FirestoreContext.Provider value={{ isReady, db }}>
      <ScheduleProvider>
        {children}
      </ScheduleProvider>
    </FirestoreContext.Provider>
  );
};

export const useFirestore = () => useContext(FirestoreContext);
