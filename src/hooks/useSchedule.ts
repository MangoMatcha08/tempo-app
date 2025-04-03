import { useState, useCallback } from 'react';
import { useScheduleContext, Period, PeriodType } from '@/contexts/ScheduleContext';
import { addMinutes, addDays, startOfWeek, isToday, isSameDay, parse, set } from 'date-fns';
import { mockPeriods as defaultPeriods } from '@/utils/reminderUtils';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("ScheduleHook");

// Convert mockPeriods from reminderUtils to Period objects
const convertDefaultPeriods = (): Period[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return defaultPeriods.map(period => {
    // Parse start time with AM/PM
    const startTimeStr = period.startTime;
    const startHours = parseInt(startTimeStr.split(':')[0]);
    const startMinutesStr = startTimeStr.split(':')[1] || '00';
    const startMinutes = parseInt(startMinutesStr.split(' ')[0]);
    const startPeriod = startTimeStr.includes('PM') ? 'PM' : 'AM';
    
    // Parse end time with AM/PM
    const endTimeStr = period.endTime;
    const endHours = parseInt(endTimeStr.split(':')[0]);
    const endMinutesStr = endTimeStr.split(':')[1] || '00';
    const endMinutes = parseInt(endMinutesStr.split(' ')[0]);
    const endPeriod = endTimeStr.includes('PM') ? 'PM' : 'AM';
    
    // Convert to 24-hour format
    let startHours24 = startHours;
    if (startPeriod === 'PM' && startHours !== 12) {
      startHours24 += 12;
    } else if (startPeriod === 'AM' && startHours === 12) {
      startHours24 = 0;
    }
    
    let endHours24 = endHours;
    if (endPeriod === 'PM' && endHours !== 12) {
      endHours24 += 12;
    } else if (endPeriod === 'AM' && endHours === 12) {
      endHours24 = 0;
    }
    
    // Create start and end time Date objects
    const startTime = new Date(today);
    startTime.setHours(startHours24, startMinutes, 0, 0);
    
    const endTime = new Date(today);
    endTime.setHours(endHours24, endMinutes, 0, 0);
    
    // Determine period type based on name
    let type: PeriodType = 'core';
    if (period.name.toLowerCase().includes('lunch')) {
      type = 'other';
    } else if (period.name.toLowerCase().includes('break')) {
      type = 'other';
    } else if (period.name.toLowerCase().includes('before school') || period.name.toLowerCase().includes('after school')) {
      type = 'other';
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
    };
  });
};

export const useSchedule = () => {
  const { isReady } = useScheduleContext();
  const [periods, setPeriods] = useState<Period[]>(convertDefaultPeriods());
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
  
  const resetToDefaultSchedule = useCallback(() => {
    debugLog("Resetting to default schedule");
    setPeriods(convertDefaultPeriods());
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
    resetToDefaultSchedule,
    isToday
  };
};
