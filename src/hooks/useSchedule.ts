
import { useState, useCallback } from 'react';
import { useScheduleContext, Period, PeriodType } from '@/contexts/ScheduleContext';
import { addMinutes, addDays, startOfWeek, isToday } from 'date-fns';

// Mock data generator
const generateMockPeriods = (): Period[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const mockPeriods: Period[] = [
    {
      id: '1',
      title: 'Math 101',
      type: 'core',
      startTime: addMinutes(today, 480), // 8:00 AM
      endTime: addMinutes(today, 540),   // 9:00 AM
      location: 'Room 204',
      isRecurring: true,
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
      notes: 'Chapter 5 review',
    },
    {
      id: '2',
      title: 'English Literature',
      type: 'core',
      startTime: addMinutes(today, 560), // 9:20 AM
      endTime: addMinutes(today, 620),   // 10:20 AM
      location: 'Room 115',
      isRecurring: true,
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    },
    {
      id: '3',
      title: 'Planning Period',
      type: 'planning',
      startTime: addMinutes(today, 640), // 10:40 AM
      endTime: addMinutes(today, 700),   // 11:40 AM
      location: 'Teachers Lounge',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '4',
      title: 'Lunch Break',
      type: 'other',
      startTime: addMinutes(today, 720), // 12:00 PM
      endTime: addMinutes(today, 760),   // 12:40 PM
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '5',
      title: 'Science Lab',
      type: 'core',
      startTime: addMinutes(today, 780), // 1:00 PM
      endTime: addMinutes(today, 840),   // 2:00 PM
      location: 'Lab 3',
      isRecurring: true,
      daysOfWeek: [2, 4], // Tue, Thu
    },
    {
      id: '6',
      title: 'Art Class',
      type: 'elective',
      startTime: addMinutes(today, 780), // 1:00 PM
      endTime: addMinutes(today, 840),   // 2:00 PM
      location: 'Art Studio',
      isRecurring: true,
      daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    },
    {
      id: '7',
      title: 'Faculty Meeting',
      type: 'meeting',
      startTime: addMinutes(today, 900), // 3:00 PM
      endTime: addMinutes(today, 960),   // 4:00 PM
      location: 'Conference Room',
      isRecurring: true,
      daysOfWeek: [3], // Wed only
      notes: 'Bring semester plans',
    },
  ];
  
  return mockPeriods;
};

export const useSchedule = () => {
  const { isReady } = useScheduleContext();
  const [periods, setPeriods] = useState<Period[]>(generateMockPeriods());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get periods for a specific day
  const getPeriodsForDay = useCallback((date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return periods.filter(period => {
      // For non-recurring periods, check exact date
      if (!period.isRecurring) {
        const periodDate = period.startTime;
        return (
          periodDate.getFullYear() === date.getFullYear() &&
          periodDate.getMonth() === date.getMonth() &&
          periodDate.getDate() === date.getDate()
        );
      }
      
      // For recurring periods, check if this day of week is included
      return period.daysOfWeek?.includes(dayOfWeek) ?? false;
    });
  }, [periods]);
  
  // Get the current active period
  const getCurrentPeriod = useCallback(() => {
    if (!isReady) return null;
    
    const now = new Date();
    const todayPeriods = getPeriodsForDay(now);
    
    return todayPeriods.find(period => {
      return now >= period.startTime && now <= period.endTime;
    }) || null;
  }, [getPeriodsForDay, isReady]);
  
  // Add a new period
  const addPeriod = useCallback((periodData: Omit<Period, 'id'>) => {
    const newPeriod: Period = {
      ...periodData,
      id: Math.random().toString(36).substring(2, 9), // Generate random ID
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setPeriods(prev => [...prev, newPeriod]);
    return newPeriod;
  }, []);
  
  // Update an existing period
  const updatePeriod = useCallback((periodId: string, periodData: Partial<Period>) => {
    setPeriods(prev => prev.map(period => {
      if (period.id === periodId) {
        return {
          ...period,
          ...periodData,
          updatedAt: new Date(),
        };
      }
      return period;
    }));
  }, []);
  
  // Delete a period
  const deletePeriod = useCallback((periodId: string) => {
    setPeriods(prev => prev.filter(period => period.id !== periodId));
  }, []);
  
  // Get days of the week for the weekly calendar
  const getDaysOfWeek = useCallback((referenceDate: Date) => {
    const result: Date[] = [];
    const startDay = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Week starts on Monday
    
    for (let i = 0; i < 7; i++) {
      result.push(addDays(startDay, i));
    }
    
    return result;
  }, []);
  
  return {
    periods,
    loading,
    error,
    getPeriodsForDay,
    getCurrentPeriod,
    addPeriod,
    updatePeriod,
    deletePeriod,
    getDaysOfWeek,
    isToday
  };
};
