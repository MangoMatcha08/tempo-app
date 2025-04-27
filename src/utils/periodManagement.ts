import { Period, isPeriod, ensurePeriodDates, toPeriodDate } from '@/types/periodTypes';
import { ensureValidDate } from './dateCore';
import { isDateInRange, compareDates } from './dateTransformations';
import { addMinutes, isSameDay } from 'date-fns';

/**
 * Result of period overlap detection
 */
export interface PeriodOverlapResult {
  hasOverlap: boolean;
  overlappingPeriods: Period[];
  overlapDuration?: number;
}

/**
 * Check if two periods overlap
 */
export function doPeriodsOverlap(period1: Period, period2: Period): boolean {
  // Different days don't overlap
  if (period1.isRecurring && period2.isRecurring) {
    const sharedDays = period1.daysOfWeek?.filter(day => period2.daysOfWeek?.includes(day));
    if (!sharedDays || sharedDays.length === 0) {
      return false;
    }
  } else {
    const date1 = toPeriodDate(period1.startTime);
    const date2 = toPeriodDate(period2.startTime);
    if (!isSameDay(date1, date2)) {
      return false;
    }
  }

  const start1Time = toPeriodDate(period1.startTime).getHours() * 60 + toPeriodDate(period1.startTime).getMinutes();
  const end1Time = toPeriodDate(period1.endTime).getHours() * 60 + toPeriodDate(period1.endTime).getMinutes();
  const start2Time = toPeriodDate(period2.startTime).getHours() * 60 + toPeriodDate(period2.startTime).getMinutes();
  const end2Time = toPeriodDate(period2.endTime).getHours() * 60 + toPeriodDate(period2.endTime).getMinutes();
  
  return Math.max(start1Time, start2Time) < Math.min(end1Time, end2Time);
}

/**
 * Calculate overlap duration in minutes
 */
export function calculateOverlapDuration(period1: Period, period2: Period): number {
  if (!doPeriodsOverlap(period1, period2)) {
    return 0;
  }
  
  // Fix: Calculate duration in milliseconds first, then convert to minutes
  const overlapMs = Math.min(toPeriodDate(period1.endTime).getTime(), toPeriodDate(period2.endTime).getTime()) - 
                   Math.max(toPeriodDate(period1.startTime).getTime(), toPeriodDate(period2.startTime).getTime());
  
  return Math.max(0, overlapMs / (1000 * 60));
}

/**
 * Check if a new period would overlap with existing periods
 * @returns Overlap result with details
 */
export function detectPeriodOverlaps(newPeriod: Period, existingPeriods: Period[]): PeriodOverlapResult {
  const overlappingPeriods = existingPeriods.filter(period => 
    period.id !== newPeriod.id && // Don't compare with itself
    doPeriodsOverlap(newPeriod, period)
  );
  
  const overlapDurations = overlappingPeriods.map(period => 
    calculateOverlapDuration(newPeriod, period)
  );
  
  // Get maximum overlap duration
  const maxOverlap = overlapDurations.length > 0
    ? Math.max(...overlapDurations)
    : 0;
  
  return {
    hasOverlap: overlappingPeriods.length > 0,
    overlappingPeriods,
    overlapDuration: maxOverlap
  };
}

/**
 * Find available time slots between periods
 * @param periods List of periods
 * @param minDuration Minimum duration in minutes
 * @param date Target date
 * @returns Available time slots as Period objects
 */
export function findAvailableTimeSlots(
  periods: Period[], 
  minDuration: number = 30, 
  date: Date = new Date()
): Period[] {
  // Ensure all periods have proper Date objects
  const validPeriods = periods.map(ensurePeriodDates);
  const targetDate = ensureValidDate(date);
  
  // Filter periods for the target date
  let dayPeriods = validPeriods.filter(period => {
    if (!period.isRecurring) {
      return isSameDay(toPeriodDate(period.startTime), targetDate);
    }
    
    const dayOfWeek = targetDate.getDay();
    return period.daysOfWeek?.includes(dayOfWeek) || false;
  });
  
  // Sort periods by their start times
  dayPeriods.sort((a, b) => {
    const startA = toPeriodDate(a.startTime).getTime();
    const startB = toPeriodDate(b.startTime).getTime();
    return startA - startB;
  });
  
  const availableSlots: Period[] = [];
  const dayStart = new Date(targetDate);
  dayStart.setHours(7, 0, 0, 0); // Start at 7 AM
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(18, 0, 0, 0); // End at 6 PM
  
  // If no periods, the entire day is available
  if (dayPeriods.length === 0) {
    availableSlots.push({
      id: 'available-all-day',
      name: 'Available All Day',
      title: 'Available All Day',
      type: 'other',
      startTime: dayStart,
      endTime: dayEnd
    });
    return availableSlots;
  }
  
  // Check for gap before first period
  const firstPeriod = dayPeriods[0];
  const firstStart = toPeriodDate(firstPeriod.startTime).getHours() * 60 + toPeriodDate(firstPeriod.startTime).getMinutes();
  const dayStartMinutes = dayStart.getHours() * 60 + dayStart.getMinutes();
  
  if (firstStart - dayStartMinutes >= minDuration) {
    const slotStart = new Date(targetDate);
    slotStart.setHours(dayStart.getHours(), dayStart.getMinutes(), 0, 0);
    
    const slotEnd = new Date(targetDate);
    slotEnd.setHours(
      Math.floor(firstStart / 60),
      firstStart % 60,
      0,
      0
    );
    
    availableSlots.push({
      id: `available-morning`,
      name: 'Morning Availability',
      title: 'Morning Availability',
      type: 'other',
      startTime: slotStart,
      endTime: slotEnd
    });
  }
  
  // Check for gaps between periods
  for (let i = 0; i < dayPeriods.length - 1; i++) {
    const currentEnd = toPeriodDate(dayPeriods[i].endTime).getHours() * 60 + toPeriodDate(dayPeriods[i].endTime).getMinutes();
    const nextStart = toPeriodDate(dayPeriods[i + 1].startTime).getHours() * 60 + toPeriodDate(dayPeriods[i + 1].startTime).getMinutes();
    
    if (nextStart - currentEnd >= minDuration) {
      const slotStart = new Date(targetDate);
      slotStart.setHours(
        Math.floor(currentEnd / 60),
        currentEnd % 60,
        0,
        0
      );
      
      const slotEnd = new Date(targetDate);
      slotEnd.setHours(
        Math.floor(nextStart / 60),
        nextStart % 60,
        0,
        0
      );
      
      availableSlots.push({
        id: `available-${i}`,
        name: 'Available Time',
        title: 'Available Time',
        type: 'other',
        startTime: slotStart,
        endTime: slotEnd
      });
    }
  }
  
  // Check for gap after last period
  const lastPeriod = dayPeriods[dayPeriods.length - 1];
  const lastEnd = toPeriodDate(lastPeriod.endTime).getHours() * 60 + toPeriodDate(lastPeriod.endTime).getMinutes();
  const dayEndMinutes = dayEnd.getHours() * 60 + dayEnd.getMinutes();
  
  if (dayEndMinutes - lastEnd >= minDuration) {
    const slotStart = new Date(targetDate);
    slotStart.setHours(
      Math.floor(lastEnd / 60),
      lastEnd % 60,
      0,
      0
    );
    
    const slotEnd = new Date(targetDate);
    slotEnd.setHours(dayEnd.getHours(), dayEnd.getMinutes(), 0, 0);
    
    availableSlots.push({
      id: `available-evening`,
      name: 'Evening Availability',
      title: 'Evening Availability',
      type: 'other',
      startTime: slotStart,
      endTime: slotEnd
    });
  }
  
  return availableSlots;
}

/**
 * Group periods by day
 */
export function groupPeriodsByDay(periods: Period[]): Map<string, Period[]> {
  const periodsByDay = new Map<string, Period[]>();
  
  periods.forEach(period => {
    if (!period.isRecurring) {
      const date = toPeriodDate(period.startTime);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!periodsByDay.has(dateKey)) {
        periodsByDay.set(dateKey, []);
      }
      
      periodsByDay.get(dateKey)?.push(period);
    } else {
      period.daysOfWeek?.forEach(dayOfWeek => {
        const dayKey = `day-${dayOfWeek}`;
        
        if (!periodsByDay.has(dayKey)) {
          periodsByDay.set(dayKey, []);
        }
        
        periodsByDay.get(dayKey)?.push(period);
      });
    }
  });
  
  // Sort periods by their start times
  periodsByDay.forEach((dayPeriods) => {
    dayPeriods.sort((a, b) => {
      const startA = toPeriodDate(a.startTime).getTime();
      const startB = toPeriodDate(b.startTime).getTime();
      return startA - startB;
    });
  });
  
  return periodsByDay;
}

/**
 * Calculate period transition times
 */
export function calculatePeriodTransitions(periods: Period[]): Array<{
  time: Date;
  fromPeriod: Period | null;
  toPeriod: Period | null;
  transitionMinutes: number;
}> {
  // Ensure all periods have proper Date objects
  const validPeriods = periods.map(ensurePeriodDates);
  
  const sortedPeriods = [...validPeriods].sort((a, b) => 
    toPeriodDate(a.startTime).getTime() - toPeriodDate(b.startTime).getTime()
  );
  
  const transitions = [];
  
  for (const period of sortedPeriods) {
    transitions.push({
      time: toPeriodDate(period.startTime),
      fromPeriod: null,
      toPeriod: period,
      transitionMinutes: 0
    });
    
    transitions.push({
      time: toPeriodDate(period.endTime),
      fromPeriod: period,
      toPeriod: null,
      transitionMinutes: 0
    });
  }
  
  transitions.sort((a, b) => a.time.getTime() - b.time.getTime());
  
  return transitions;
}

/**
 * Find ideal periods for a reminder based on various factors
 */
export function suggestIdealPeriods(
  periods: Period[], 
  durationEstimate: number = 30, 
  preferredTypes: string[] = []
): Period[] {
  const availableSlots = findAvailableTimeSlots(periods, durationEstimate);
  const allCandidates = [...availableSlots, ...periods];
  
  // Score each period/slot
  const scoredCandidates = allCandidates.map(period => {
    let score = 0;
    
    // Higher score for available slots
    if (availableSlots.includes(period)) {
      score += 10;
      
      // Higher score if slot duration closely matches estimate
      const duration = (period.endTime.getTime() - period.startTime.getTime()) / (60 * 1000);
      score += 10 - Math.min(10, Math.abs(duration - durationEstimate) / 10);
    }
    
    // Higher score for preferred types
    if (preferredTypes.includes(period.type)) {
      score += 5;
    }
    
    // Penalize early morning and late evening
    const hour = period.startTime.getHours();
    if (hour < 8) score -= 3;
    if (hour > 17) score -= 2;
    
    return { period, score };
  });
  
  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);
  
  // Return top candidates
  return scoredCandidates.slice(0, 5).map(c => c.period);
}
