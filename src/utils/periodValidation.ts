
import { Period, PeriodValidationResult } from '@/types/periodTypes';
import { parseTimeString } from './dateTimeUtils';
import { format } from 'date-fns';
import { ensureValidDate } from './dateCore';

export function validatePeriodTime(date: Date, periodId: string, periods: Period[]): PeriodValidationResult {
  const period = periods.find(p => p.id === periodId);
  
  if (!period) {
    return {
      isValid: false,
      error: 'Invalid period selected'
    };
  }
  
  try {
    const getTimeComponents = (time: string | Date) => {
      if (time instanceof Date) {
        return {
          hours: time.getHours(),
          minutes: time.getMinutes()
        };
      }
      return parseTimeString(time);
    };

    const periodStart = getTimeComponents(period.startTime);
    const periodEnd = getTimeComponents(period.endTime);
    const currentTime = {
      hours: date.getHours(),
      minutes: date.getMinutes()
    };
    
    const isAfterStart = 
      currentTime.hours > periodStart.hours || 
      (currentTime.hours === periodStart.hours && currentTime.minutes >= periodStart.minutes);
      
    const isBeforeEnd =
      currentTime.hours < periodEnd.hours ||
      (currentTime.hours === periodEnd.hours && currentTime.minutes <= periodEnd.minutes);
    
    if (!isAfterStart || !isBeforeEnd) {
      const formatTime = (time: string | Date) => {
        if (time instanceof Date) {
          return format(time, 'HH:mm');
        }
        return time;
      };
      
      return {
        isValid: false,
        error: `Time must be within period hours (${formatTime(period.startTime)} - ${formatTime(period.endTime)})`
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.error('Error validating period time:', error);
    return {
      isValid: false,
      error: 'Error validating period time'
    };
  }
}

export function detectPeriodConflicts(
  date: Date,
  periodId: string,
  periods: Period[]
): PeriodValidationResult {
  const selectedPeriod = periods.find(p => p.id === periodId);
  if (!selectedPeriod) {
    return {
      isValid: false,
      error: 'Invalid period selected'
    };
  }
  
  const conflictingPeriods = periods.filter(period => {
    if (period.id === periodId) return false;
    
    const selectedStart = parseTimeString(selectedPeriod.startTime);
    const selectedEnd = parseTimeString(selectedPeriod.endTime);
    const periodStart = parseTimeString(period.startTime);
    const periodEnd = parseTimeString(period.endTime);
    
    return (
      (selectedStart.hours < periodEnd.hours || 
       (selectedStart.hours === periodEnd.hours && selectedStart.minutes < periodEnd.minutes)) &&
      (selectedEnd.hours > periodStart.hours ||
       (selectedEnd.hours === periodStart.hours && selectedEnd.minutes > periodStart.minutes))
    );
  });
  
  return {
    isValid: conflictingPeriods.length === 0,
    conflictingPeriods: conflictingPeriods.length > 0 ? conflictingPeriods : undefined,
    error: conflictingPeriods.length > 0 ? 'Time conflicts with other periods' : undefined
  };
}
