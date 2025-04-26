import { Period } from '@/contexts/ScheduleContext';
import { ensureValidDate } from './dateCore';
import { isDateInRange, compareDates } from './dateTransformations';
import { addMinutes, isSameDay } from 'date-fns';

/**
 * Result of period overlap detection
 */
export interface PeriodOverlapResult {
  hasOverlap: boolean;
  overlappingPeriods: Period[];
  overlapDuration?: number; // in minutes
}

/**
 * Check if two periods overlap
 */
export function doPeriodsOverlap(period1: Period, period2: Period): boolean {
  // Different days don't overlap
  if (period1.isRecurring && period2.isRecurring) {
    // For recurring periods, check if they share any days
    const sharedDays = period1.daysOfWeek?.filter(day => period2.daysOfWeek?.includes(day));
    if (!sharedDays || sharedDays.length === 0) {
      return false; // No shared days, no overlap
    }
  } else if (!isSameDay(ensureValidDate(period1.startTime), ensureValidDate(period2.startTime))) {
    return false; // Different non-recurring days don't overlap
  }

  const start1 = ensureValidDate(period1.startTime);
  const end1 = ensureValidDate(period1.endTime);
  const start2 = ensureValidDate(period2.startTime);
  const end2 = ensureValidDate(period2.endTime);
  
  const start1Time = start1.getHours() * 60 + start1.getMinutes();
  const end1Time = end1.getHours() * 60 + end1.getMinutes();
  const start2Time = start2.getHours() * 60 + start2.getMinutes();
  const end2Time = end2.getHours() * 60 + end2.getMinutes();
  
  return Math.max(start1Time, start2Time) < Math.min(end1Time, end2Time);
}

/**
 * Calculate overlap duration in minutes
 */
export function calculateOverlapDuration(period1: Period, period2: Period): number {
  if (!doPeriodsOverlap(period1, period2)) {
    return 0;
  }
  
  const start1 = ensureValidDate(period1.startTime).getHours() * 60 + ensureValidDate(period1.startTime).getMinutes();
  const end1 = ensureValidDate(period1.endTime).getHours() * 60 + ensureValidDate(period1.endTime).getMinutes();
  const start2 = ensureValidDate(period2.startTime).getHours() * 60 + ensureValidDate(period2.startTime).getMinutes();
  const end2 = ensureValidDate(period2.endTime).getHours() * 60 + ensureValidDate(period2.endTime).getMinutes();
  
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  
  return overlapEnd - overlapStart;
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
  // Use today's date if not specified
  const targetDate = ensureValidDate(date);
  
  // Filter periods for the target date
  let dayPeriods = periods.filter(period => {
    if (!period.isRecurring) {
      return isSameDay(ensureValidDate(period.startTime), targetDate);
    }
    
    // For recurring periods, check if the day of week matches
    const dayOfWeek = targetDate.getDay();
    return period.daysOfWeek?.includes(dayOfWeek) || false;
  });
  
  // Sort periods by start time
  dayPeriods.sort((a, b) => {
    const startA = ensureValidDate(a.startTime).getHours() * 60 + ensureValidDate(a.startTime).getMinutes();
    const startB = ensureValidDate(b.startTime).getHours() * 60 + ensureValidDate(b.startTime).getMinutes();
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
  const firstStart = ensureValidDate(firstPeriod.startTime).getHours() * 60 + ensureValidDate(firstPeriod.startTime).getMinutes();
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
    const currentEnd = ensureValidDate(dayPeriods[i].endTime).getHours() * 60 + ensureValidDate(dayPeriods[i].endTime).getMinutes();
    const nextStart = ensureValidDate(dayPeriods[i + 1].startTime).getHours() * 60 + ensureValidDate(dayPeriods[i + 1].startTime).getMinutes();
    
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
  const lastEnd = ensureValidDate(lastPeriod.endTime).getHours() * 60 + ensureValidDate(lastPeriod.endTime).getMinutes();
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
 * @returns Map of day date string to period array
 */
export function groupPeriodsByDay(periods: Period[]): Map<string, Period[]> {
  const periodsByDay = new Map<string, Period[]>();
  
  periods.forEach(period => {
    if (!period.isRecurring) {
      // For non-recurring periods, group by actual date
      const dateKey = ensureValidDate(period.startTime).toISOString().split('T')[0];
      
      if (!periodsByDay.has(dateKey)) {
        periodsByDay.set(dateKey, []);
      }
      
      periodsByDay.get(dateKey)?.push(period);
    } else {
      // For recurring periods, add to each day of week
      period.daysOfWeek?.forEach(dayOfWeek => {
        const dayKey = `day-${dayOfWeek}`;
        
        if (!periodsByDay.has(dayKey)) {
          periodsByDay.set(dayKey, []);
        }
        
        periodsByDay.get(dayKey)?.push(period);
      });
    }
  });
  
  // Sort periods within each day
  periodsByDay.forEach((dayPeriods) => {
    dayPeriods.sort((a, b) => {
      const startA = ensureValidDate(a.startTime);
      const startB = ensureValidDate(b.startTime);
      return startA.getTime() - startB.getTime();
    });
  });
  
  return periodsByDay;
}

/**
 * Calculate period transition times
 * @returns Array of transition times with from/to period info
 */
export function calculatePeriodTransitions(periods: Period[]): Array<{
  time: Date;
  fromPeriod: Period | null;
  toPeriod: Period | null;
  transitionMinutes: number;
}> {
  // Sort periods by start time
  const sortedPeriods = [...periods].sort((a, b) => 
    compareDates(a.startTime, b.startTime)
  );
  
  const transitions: Array<{
    time: Date;
    fromPeriod: Period | null;
    toPeriod: Period | null;
    transitionMinutes: number;
  }> = [];
  
  // Add transitions at period start times
  for (let i = 0; i < sortedPeriods.length; i++) {
    const currentPeriod = sortedPeriods[i];
    
    // Find previous period that's still active
    let fromPeriod: Period | null = null;
    for (let j = 0; j < i; j++) {
      const prevPeriod = sortedPeriods[j];
      if (compareDates(prevPeriod.endTime, currentPeriod.startTime) >= 0) {
        // Found a period that's still active
        fromPeriod = prevPeriod;
        break;
      }
    }
    
    // Calculate transition minutes (negative means overlap)
    const transitionMinutes = fromPeriod 
      ? (currentPeriod.startTime.getTime() - fromPeriod.endTime.getTime()) / (60 * 1000)
      : 0;
    
    transitions.push({
      time: new Date(currentPeriod.startTime),
      fromPeriod,
      toPeriod: currentPeriod,
      transitionMinutes
    });
  }
  
  // Add transitions at period end times
  for (const period of sortedPeriods) {
    // Find next period that starts after this one ends
    let nextPeriod: Period | null = null;
    for (const p of sortedPeriods) {
      if (compareDates(p.startTime, period.endTime) >= 0) {
        // Found the next period
        if (!nextPeriod || compareDates(p.startTime, nextPeriod.startTime) < 0) {
          nextPeriod = p;
        }
      }
    }
    
    // Calculate transition minutes
    const transitionMinutes = nextPeriod 
      ? (nextPeriod.startTime.getTime() - period.endTime.getTime()) / (60 * 1000) 
      : 0;
    
    transitions.push({
      time: new Date(period.endTime),
      fromPeriod: period,
      toPeriod: nextPeriod,
      transitionMinutes
    });
  }
  
  // Sort all transitions by time
  transitions.sort((a, b) => compareDates(a.time, b.time));
  
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
