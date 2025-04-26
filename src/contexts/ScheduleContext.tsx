
import { createContext, useContext, ReactNode, useState } from "react";
import { useFirestore } from "@/contexts/FirestoreContext";
import type { Period as BasePeriod, PeriodType } from "@/types/periodTypes";

// Extend the base Period type
export interface Period extends BasePeriod {
  title: string;  // Alias for name
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

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const { isReady } = useFirestore();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // In a real app, we would fetch data from Firestore here
  // For now, we'll use mock data
  
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

// Updated conversion helper to handle name/title mapping
export function convertToPeriod(schedulePeriod: Period): BasePeriod {
  return {
    id: schedulePeriod.id,
    name: schedulePeriod.title, // Map title to name
    startTime: schedulePeriod.startTime,
    endTime: schedulePeriod.endTime,
    type: schedulePeriod.type,
  };
}
