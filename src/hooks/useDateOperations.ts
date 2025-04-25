
import { useState, useCallback } from 'react';
import { 
  ensureValidDate, 
  formatDateWithPeriod, 
  getRelativeTimeDisplay,
  getNearestPeriodTime 
} from '@/utils/enhancedDateUtils';
import { 
  formatWithTimezone,
  isDateInRange,
  areDatesEqual 
} from '@/utils/dateTransformations';

export const useDateOperations = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const handleDateSelection = useCallback((date: Date) => {
    const validDate = ensureValidDate(date);
    setSelectedDate(validDate);
    
    // Find nearest period if any
    const nearestPeriod = getNearestPeriodTime(validDate);
    return nearestPeriod;
  }, []);
  
  const formatWithPeriod = useCallback((date: Date, periodId?: string) => {
    return formatDateWithPeriod(date, periodId);
  }, []);
  
  const getTimeDisplay = useCallback((date: Date) => {
    return getRelativeTimeDisplay(date);
  }, []);
  
  const formatWithZone = useCallback((date: Date, format?: string) => {
    return formatWithTimezone(date, format);
  }, []);
  
  return {
    selectedDate,
    handleDateSelection,
    formatWithPeriod,
    getTimeDisplay,
    formatWithZone
  };
};
