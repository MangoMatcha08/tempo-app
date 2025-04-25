
import { useState, useCallback, useMemo } from 'react';
import { addDays, addWeeks, addMonths, format, isValid } from 'date-fns';
import { ensureValidDate } from '@/utils/enhancedDateUtils';
import { formatWithTimezone, isDateInRange, areDatesEqual } from '@/utils/dateTransformations';
import { RecurrenceRule, RecurrenceType, generateOccurrences } from '@/utils/recurringDatePatterns';
import { Period } from '@/contexts/ScheduleContext';
import { findAvailableTimeSlots, suggestIdealPeriods } from '@/utils/periodManagement';
import { suggestDueDates, detectDateConflicts } from '@/utils/dateSuggestions';
import { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

/**
 * Enhanced date operations with recurring patterns and suggestions
 */
export const useEnhancedDate = (initialDate: Date = new Date()) => {
  const [selectedDate, setSelectedDate] = useState<Date>(ensureValidDate(initialDate));
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  
  // Calculate occurrence dates when the recurrence rule changes
  const occurrenceDates = useMemo(() => {
    if (!recurrenceRule) return [];
    return generateOccurrences(recurrenceRule, 10);
  }, [recurrenceRule]);
  
  // Set up a simple recurrence pattern
  const setupRecurrence = useCallback((
    type: RecurrenceType, 
    interval: number = 1,
    endDate?: Date | null,
    count?: number | null
  ) => {
    setRecurrenceRule({
      type,
      interval,
      startDate: selectedDate,
      endDate,
      count,
      daysOfWeek: type === RecurrenceType.WEEKLY ? [selectedDate.getDay()] : undefined,
      dayOfMonth: type === RecurrenceType.MONTHLY ? selectedDate.getDate() : undefined
    });
  }, [selectedDate]);
  
  // Clear recurrence pattern
  const clearRecurrence = useCallback(() => {
    setRecurrenceRule(null);
  }, []);
  
  // Get period suggestions based on date
  const getPeriodSuggestions = useCallback((
    periods: Period[],
    duration: number = 30,
    preferredTypes: string[] = []
  ) => {
    return suggestIdealPeriods(periods, duration, preferredTypes);
  }, []);
  
  // Get date suggestions based on reminder details
  const getDateSuggestions = useCallback((
    category: ReminderCategory,
    priority: ReminderPriority,
    description: string = "",
    periods: Period[] = []
  ) => {
    return suggestDueDates(category, priority, description, periods);
  }, []);
  
  // Check for date conflicts
  const checkDateConflicts = useCallback((
    date: Date,
    periods: Period[],
    existingReminders: Array<{ dueDate: Date; priority: ReminderPriority; category: ReminderCategory }> = []
  ) => {
    return detectDateConflicts(date, periods, existingReminders);
  }, []);
  
  // Find available time slots
  const getAvailableTimeSlots = useCallback((
    periods: Period[],
    minDuration: number = 30,
    date: Date = selectedDate
  ) => {
    return findAvailableTimeSlots(periods, minDuration, date);
  }, [selectedDate]);
  
  // Format date with timezone consideration
  const formatDate = useCallback((date: Date, formatStr: string = 'yyyy-MM-dd HH:mm') => {
    return formatWithTimezone(date, formatStr);
  }, []);
  
  // Check if a date is in a range
  const isInRange = useCallback((date: Date, startDate: Date, endDate: Date) => {
    return isDateInRange(date, startDate, endDate);
  }, []);
  
  // Check if two dates are equal
  const checkDatesEqual = useCallback((date1: Date, date2: Date) => {
    return areDatesEqual(date1, date2);
  }, []);
  
  return {
    selectedDate,
    setSelectedDate,
    recurrenceRule,
    setRecurrenceRule,
    occurrenceDates,
    setupRecurrence,
    clearRecurrence,
    getPeriodSuggestions,
    getDateSuggestions,
    checkDateConflicts,
    getAvailableTimeSlots,
    formatDate,
    isInRange,
    checkDatesEqual
  };
};
