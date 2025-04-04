import { useState, useCallback } from 'react';
import { useScheduleContext, Period, PeriodType } from '@/contexts/ScheduleContext';
import { addMinutes, addDays, startOfWeek, isToday, isSameDay } from 'date-fns';

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
      notes: 'Collect homework, Review Chapter 5, Quiz preparation',
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
      notes: 'Essay due date, Discussion on Hamlet',
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
      notes: 'Grade papers, Prepare test materials',
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
      notes: 'Chemical reactions demo, Safety procedures review',
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
      notes: 'Materials for next project, Student showcase preparation',
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
      notes: 'Budget discussion, Upcoming events, Parent-teacher conferences',
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
