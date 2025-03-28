
import { createContext, useContext, ReactNode } from "react";
import { isFirebaseInitialized } from "@/lib/firebase";
import { ScheduleProvider } from "./ScheduleContext";

interface FirestoreContextType {
  isReady: boolean;
}

const FirestoreContext = createContext<FirestoreContextType>({
  isReady: false
});

export const FirestoreProvider = ({ children }: { children: ReactNode }) => {
  const isReady = isFirebaseInitialized();
  
  return (
    <FirestoreContext.Provider value={{ isReady }}>
      <ScheduleProvider>
        {children}
      </ScheduleProvider>
    </FirestoreContext.Provider>
  );
};

export const useFirestore = () => useContext(FirestoreContext);
