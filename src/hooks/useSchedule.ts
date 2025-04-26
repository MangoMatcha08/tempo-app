
import { useState, useCallback } from 'react';
import { useScheduleContext, Period } from '@/contexts/ScheduleContext';
import { PeriodType } from '@/types/periodTypes';
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
      name: 'Before School',
      type: 'other',
      startTime: createTime(8, 0),
      endTime: createTime(8, 50),
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: '1',
      title: 'Period 1',
      name: 'Period 1',
      type: 'core',
      startTime: createTime(8, 50),
      endTime: createTime(9, 50),
      location: 'Room 204',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
      notes: 'Collect homework, Review Chapter 5, Quiz preparation',
    },
    {
      id: 'break',
      title: 'Break',
      name: 'Break',
      type: 'other',
      startTime: createTime(9, 50),
      endTime: createTime(10, 5),
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: '2',
      title: 'Period 2',
      name: 'Period 2',
      type: 'core',
      startTime: createTime(10, 8),
      endTime: createTime(11, 8),
      location: 'Room 115',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
      notes: 'Essay due date, Discussion on Hamlet',
    },
    {
      id: '3',
      title: 'Period 3',
      name: 'Period 3',
      type: 'core',
      startTime: createTime(11, 11),
      endTime: createTime(12, 11),
      location: 'Room 302',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: '4',
      title: 'Period 4',
      name: 'Period 4',
      type: 'core',
      startTime: createTime(12, 14),
      endTime: createTime(13, 14),
      location: 'Lab 3',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: 'lunch',
      title: 'Lunch',
      name: 'Lunch',
      type: 'other',
      startTime: createTime(13, 14),
      endTime: createTime(13, 44),
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: '5',
      title: 'Period 5',
      name: 'Period 5',
      type: 'core',
      startTime: createTime(13, 47),
      endTime: createTime(14, 47),
      location: 'Room 203',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: '6',
      title: 'Period 6',
      name: 'Period 6',
      type: 'core',
      startTime: createTime(14, 50),
      endTime: createTime(15, 30),
      location: 'Art Studio',
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
    {
      id: 'after-school',
      title: 'After School',
      name: 'After School',
      type: 'other',
      startTime: createTime(15, 30),
      endTime: createTime(17, 0),
      isRecurring: true,
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  ];
  
  // Removed redundant mapping since name is now included directly above
  return mockPeriods;
};

export const useSchedule = () => {
  const { isReady } = useScheduleContext();
  const [periods, setPeriods] = useState<Period[]>(generateMockPeriods());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const getPeriodsForDay = useCallback((date: Date) => {
    const dayOfWeek = date.getDay();
    
    return periods.filter(period => {
      if (!period.isRecurring) {
        return isSameDay(period.startTime, date);
      }
      
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
      id: Math.random().toString(36).substring(2, 9),
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
    const startDay = startOfWeek(referenceDate, { weekStartsOn: 1 });
    
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
