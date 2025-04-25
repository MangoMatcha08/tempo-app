
import { useState, useCallback } from 'react';
import { 
  ensureValidDate, 
  formatDateWithPeriod, 
  getRelativeTimeDisplay,
  getNearestPeriodTime 
} from '@/utils/enhancedDateUtils';

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
  
  return {
    selectedDate,
    handleDateSelection,
    formatWithPeriod,
    getTimeDisplay
  };
};
