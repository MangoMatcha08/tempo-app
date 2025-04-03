import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useFirestore } from "@/contexts/FirestoreContext";
import { mockPeriods as defaultPeriods } from "@/utils/reminderUtils";
import { createDebugLogger } from "@/utils/debugUtils";

const debugLog = createDebugLogger("ScheduleContext");

// Types
export type PeriodType = "core" | "elective" | "planning" | "meeting" | "other";

export interface Period {
  id: string;
  title: string;
  type: PeriodType;
  startTime: Date;
  endTime: Date;
  location?: string;
  isRecurring?: boolean;
  daysOfWeek?: number[];
  isSpecialDay?: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  periodsByDay: {
    [key: string]: Period[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface ScheduleContextType {
  isReady: boolean;
  periods: Period[];
  templates: ScheduleTemplate[];
  currentPeriod: Period | null;
  loading: boolean;
  error: Error | null;
}

const ScheduleContext = createContext<ScheduleContextType>({
  isReady: false,
  periods: [],
  templates: [],
  currentPeriod: null,
  loading: false,
  error: null,
});

// Convert mockPeriods from reminderUtils to Period objects
const convertDefaultPeriods = (): Period[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return defaultPeriods.map(period => {
    // Parse start time
    const [startHours, startMinutes] = period.startTime.split(':').map(part => {
      const num = parseInt(part, 10);
      // If it's a single-digit hour in the afternoon (1-9), convert to 24-hour format
      if (num >= 1 && num <= 9 && period.startTime.indexOf(":") > 1) {
        return num + 12;
      }
      return num;
    });
    
    // Parse end time
    const [endHours, endMinutes] = period.endTime.split(':').map(part => {
      const num = parseInt(part, 10);
      // If it's a single-digit hour in the afternoon (1-9), convert to 24-hour format
      if (num >= 1 && num <= 9 && period.endTime.indexOf(":") > 1) {
        return num + 12;
      }
      return num;
    });
    
    // Create start and end time Date objects
    const startTime = new Date(today);
    startTime.setHours(startHours, startMinutes, 0, 0);
    
    const endTime = new Date(today);
    endTime.setHours(endHours, endMinutes, 0, 0);
    
    // Determine period type based on name
    let type: PeriodType = "core";
    if (period.name.toLowerCase().includes('lunch')) {
      type = "other";
    } else if (period.name.toLowerCase().includes('break')) {
      type = "other";
    } else if (period.name.toLowerCase().includes('before school') || period.name.toLowerCase().includes('after school')) {
      type = "other";
    }
    
    // Create Period object
    return {
      id: period.id,
      title: period.name,
      type,
      startTime,
      endTime,
      location: '',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
};

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const { isReady } = useFirestore();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize with default periods
  useEffect(() => {
    if (isReady) {
      try {
        debugLog("Initializing schedule with default periods");
        const defaultPeriodsConverted = convertDefaultPeriods();
        setPeriods(defaultPeriodsConverted);
        
        // Set current period based on current time
        const now = new Date();
        const currentPeriod = defaultPeriodsConverted.find(period => {
          return now >= period.startTime && now <= period.endTime;
        });
        
        if (currentPeriod) {
          debugLog(`Current period detected: ${currentPeriod.title}`);
          setCurrentPeriod(currentPeriod);
        } else {
          debugLog("No current period detected for this time");
        }
      } catch (err) {
        console.error("Error initializing schedule:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [isReady]);
  
  return (
    <ScheduleContext.Provider value={{ 
      isReady, 
      periods, 
      templates, 
      currentPeriod, 
      loading, 
      error 
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useScheduleContext = () => useContext(ScheduleContext);
