
import { useState, useCallback } from 'react';
import { 
  ensureValidDate, 
  formatDateWithPeriod, 
  getRelativeTimeDisplay,
  getNearestPeriodTime 
} from '@/utils/enhancedDateUtils';
import { 
  formatWithTimeZone,
  isDateInRange,
  areDatesEqual 
} from '@/utils/dateUtils';
import { APP_TIMEZONE, toPSTTime } from '@/utils/dateTimeUtils';

export const useDateOperations = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(toPSTTime(new Date()));
  
  const handleDateSelection = useCallback((date: Date) => {
    const validDate = ensureValidDate(date);
    const pstDate = toPSTTime(validDate);
    setSelectedDate(pstDate);
    
    // Find nearest period if any
    const nearestPeriod = getNearestPeriodTime(pstDate);
    return nearestPeriod;
  }, []);
  
  const formatWithPeriod = useCallback((date: Date, periodId?: string) => {
    return formatDateWithPeriod(date, periodId);
  }, []);
  
  const getTimeDisplay = useCallback((date: Date) => {
    return getRelativeTimeDisplay(date);
  }, []);
  
  const formatWithZone = useCallback((date: Date, format?: string) => {
    return formatWithTimeZone(date, format, APP_TIMEZONE);
  }, []);
  
  return {
    selectedDate,
    handleDateSelection,
    formatWithPeriod,
    getTimeDisplay,
    formatWithZone
  };
};
