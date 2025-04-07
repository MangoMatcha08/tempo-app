
import { useState, useCallback } from 'react';
import { useScheduleContext, Period, PeriodType } from '@/contexts/ScheduleContext';
import { addMinutes, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';

// Mock data generator
const generateMockPeriods = (): Period[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const createTime = (hour: number, minute: number) => {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
  };
  
  const mockPeriods: Period[] = [
    {
      id: 'before-school',
      title: 'Before School',
      type: 'other',
      startTime: createTime(8, 0), // 8:00 AM
      endTime: createTime(8, 50),  // 8:50 AM
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '1',
      title: 'Period 1',
      type: 'core',
      startTime: createTime(8, 50), // 8:50 AM
      endTime: createTime(9, 50),   // 9:50 AM
      location: 'Room 204',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      notes: 'Collect homework, Review Chapter 5, Quiz preparation',
    },
    {
      id: 'break',
      title: 'Break',
      type: 'other',
      startTime: createTime(9, 50), // 9:50 AM
      endTime: createTime(10, 5),   // 10:05 AM
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '2',
      title: 'Period 2',
      type: 'core',
      startTime: createTime(10, 8), // 10:08 AM
      endTime: createTime(11, 8),   // 11:08 AM
      location: 'Room 115',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      notes: 'Essay due date, Discussion on Hamlet',
    },
    {
      id: '3',
      title: 'Period 3',
      type: 'core',
      startTime: createTime(11, 11), // 11:11 AM
      endTime: createTime(12, 11),   // 12:11 PM
      location: 'Room 302',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '4',
      title: 'Period 4',
      type: 'core',
      startTime: createTime(12, 14), // 12:14 PM
      endTime: createTime(13, 14),   // 1:14 PM
      location: 'Lab 3',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: 'lunch',
      title: 'Lunch',
      type: 'other',
      startTime: createTime(13, 14), // 1:14 PM
      endTime: createTime(13, 44),   // 1:44 PM
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '5',
      title: 'Period 5',
      type: 'core',
      startTime: createTime(13, 47), // 1:47 PM
      endTime: createTime(14, 47),   // 2:47 PM
      location: 'Room 203',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: '6',
      title: 'Period 6',
      type: 'core',
      startTime: createTime(14, 50), // 2:50 PM
      endTime: createTime(15, 30),   // 3:30 PM
      location: 'Art Studio',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
    {
      id: 'after-school',
      title: 'After School',
      type: 'other',
      startTime: createTime(15, 30), // 3:30 PM
      endTime: createTime(17, 0),    // 5:00 PM
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
    },
  ];
  
  return mockPeriods;
};

export const useSchedule = () => {
  const { isReady } = useScheduleContext();
  const [periods, setPeriods] = useState<Period[]>(generateMockPeriods());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const getPeriodsForDay = useCallback((date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return periods.filter(period => {
      if (!period.isRecurring) {
        // For non-recurring events, check if the dates match (ignoring time)
        return isSameDay(period.startTime, date);
      }
      
      // For recurring periods, check if this day of week is included
      return period.daysOfWeek?.includes(dayOfWeek) ?? false;
    });
  }, [periods]);
  
  const getCurrentPeriod = useCallback(() => {
    if (!isReady) return null;
    
    const now = new Date();
    const todayPeriods = getPeriodsForDay(now);
    
    return todayPeriods.find(period => {
      return now >= period.startTime && now <= period.endTime;
    }) || null;
  }, [getPeriodsForDay, isReady]);
  
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
  
  const deletePeriod = useCallback((periodId: string) => {
    setPeriods(prev => prev.filter(period => period.id !== periodId));
  }, []);
  
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
