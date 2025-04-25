import { addDays, addBusinessDays, isSameDay, differenceInDays, startOfToday, isWeekend } from 'date-fns';
import { Period } from '@/contexts/ScheduleContext';
import { ensureValidDate } from './enhancedDateUtils';
import { findAvailableTimeSlots } from './periodManagement';
import { ReminderCategory, ReminderPriority } from '@/types/reminderTypes';

/**
 * Suggestion result with date and confidence score
 */
export interface DateSuggestion {
  suggestedDate: Date;
  confidence: number;  // 0-1 score for how good the suggestion is
  periodId?: string;   // Optional period ID if suggestion is tied to a period
  reasoning: string;   // Human-readable explanation
}

/**
 * Get smart due date suggestions based on various factors
 */
export function suggestDueDates(
  category: ReminderCategory,
  priority: ReminderPriority,
  description: string = "",
  periods: Period[] = [],
  count: number = 3
): DateSuggestion[] {
  const suggestions: DateSuggestion[] = [];
  const today = startOfToday();
  const now = new Date();
  
  // Base suggestion: today for high priority
  if (priority === ReminderPriority.HIGH) {
    suggestions.push({
      suggestedDate: now,
      confidence: 0.9,
      reasoning: "High priority task suggested for today"
    });
  }
  
  // Tomorrow for medium priority
  if (priority === ReminderPriority.MEDIUM) {
    suggestions.push({
      suggestedDate: addDays(now, 1),
      confidence: 0.8,
      reasoning: "Medium priority task suggested for tomorrow"
    });
  }
  
  // Next business day if tomorrow is weekend
  const tomorrow = addDays(today, 1);
  if (isWeekend(tomorrow)) {
    suggestions.push({
      suggestedDate: addBusinessDays(today, 1),
      confidence: 0.85,
      reasoning: "Suggested for next business day since tomorrow is weekend"
    });
  }
  
  // Category-specific suggestions
  switch (category) {
    case ReminderCategory.DEADLINE:
      // For deadlines, suggest end of day
      const endOfDay = new Date(today);
      endOfDay.setHours(16, 0, 0, 0);
      suggestions.push({
        suggestedDate: endOfDay,
        confidence: 0.85,
        reasoning: "Deadlines are best set to end of day"
      });
      break;
      
    case ReminderCategory.MEETING:
      // For meetings, suggest available slots
      const availableToday = findAvailableTimeSlots(periods, 30, today);
      
      if (availableToday.length > 0) {
        const meetingSlot = availableToday[0];
        suggestions.push({
          suggestedDate: meetingSlot.startTime,
          confidence: 0.75,
          reasoning: "Available time slot found today"
        });
      } else {
        // Try tomorrow
        const tomorrowDate = addDays(today, 1);
        const availableTomorrow = findAvailableTimeSlots(periods, 30, tomorrowDate);
        
        if (availableTomorrow.length > 0) {
          const meetingSlot = availableTomorrow[0];
          suggestions.push({
            suggestedDate: meetingSlot.startTime,
            confidence: 0.7,
            reasoning: "Available time slot found tomorrow"
          });
        }
      }
      break;
      
    case ReminderCategory.PREPARATION:
      // For prep, suggest 2 days before (if description contains words like "prepare")
      if (description.toLowerCase().match(/\b(prepare|prep|ready|material|presentation)\b/)) {
        suggestions.push({
          suggestedDate: addBusinessDays(today, 2),
          confidence: 0.75,
          reasoning: "Preparation tasks typically need advance time"
        });
      }
      break;
      
    case ReminderCategory.GRADING:
      // For grading, suggest after school hours
      const afterSchool = new Date(today);
      afterSchool.setHours(15, 30, 0, 0);
      
      suggestions.push({
        suggestedDate: afterSchool,
        confidence: 0.8,
        reasoning: "Grading tasks are best done after school hours"
      });
      
      // Also suggest weekend if a lot of grading (detect keywords)
      const lotsOfGrading = description.toLowerCase().match(/\b(essays|exams|tests|finals|midterms)\b/);
      if (lotsOfGrading) {
        // Find next weekend
        let nextWeekend = new Date(today);
        while (!isWeekend(nextWeekend)) {
          nextWeekend = addDays(nextWeekend, 1);
        }
        
        suggestions.push({
          suggestedDate: nextWeekend,
          confidence: 0.7,
          reasoning: "Large grading tasks might require weekend time"
        });
      }
      break;
      
    default:
      // For other categories, use generic suggestions based on priority
      if (priority === ReminderPriority.LOW) {
        suggestions.push({
          suggestedDate: addBusinessDays(today, 3),
          confidence: 0.6,
          reasoning: "Low priority task suggested for later this week"
        });
      }
  }
  
  // Add period-based suggestions if available
  if (periods.length > 0) {
    // Find periods that match category and might be relevant
    const matchingPeriods = periods.filter(period => {
      // Logic to match periods with reminder category
      if (category === ReminderCategory.GRADING && period.title.toLowerCase().includes("planning")) {
        return true;
      }
      if (category === ReminderCategory.COMMUNICATION && period.title.toLowerCase().includes("break")) {
        return true;
      }
      return false;
    });
    
    if (matchingPeriods.length > 0) {
      const bestPeriod = matchingPeriods[0];
      suggestions.push({
        suggestedDate: bestPeriod.startTime,
        confidence: 0.8,
        periodId: bestPeriod.id,
        reasoning: `Matched with "${bestPeriod.title}" period`
      });
    }
  }
  
  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  // Return top N suggestions
  return suggestions.slice(0, count);
}

/**
 * Detect potential conflicts with a suggested due date
 * @returns Array of conflicts with reasons
 */
export function detectDateConflicts(
  suggestedDate: Date,
  periods: Period[],
  existingReminders: { dueDate: Date; priority: ReminderPriority; category: ReminderCategory }[] = []
): Array<{ reason: string; severity: 'low' | 'medium' | 'high' }> {
  const conflicts = [];
  const validDate = ensureValidDate(suggestedDate);
  
  // Check if date is in the past
  if (validDate < new Date()) {
    conflicts.push({
      reason: "The suggested date is in the past",
      severity: 'high'
    });
  }
  
  // Check period conflicts
  const dayPeriods = periods.filter(period => {
    if (!period.isRecurring) {
      return isSameDay(period.startTime, validDate);
    } else {
      const dayOfWeek = validDate.getDay();
      return period.daysOfWeek?.includes(dayOfWeek) || false;
    }
  });
  
  // Check if time falls within a period
  for (const period of dayPeriods) {
    const periodStart = period.startTime.getHours() * 60 + period.startTime.getMinutes();
    const periodEnd = period.endTime.getHours() * 60 + period.endTime.getMinutes();
    const suggestedTime = validDate.getHours() * 60 + validDate.getMinutes();
    
    if (suggestedTime >= periodStart && suggestedTime <= periodEnd) {
      conflicts.push({
        reason: `Time conflicts with "${period.title}" period`,
        severity: 'medium'
      });
    }
  }
  
  // Check for reminder concentration
  const sameDay = existingReminders.filter(r => 
    isSameDay(r.dueDate, validDate)
  );
  
  if (sameDay.length >= 5) {
    conflicts.push({
      reason: `Already have ${sameDay.length} reminders on this day`,
      severity: 'medium'
    });
  }
  
  // Check for high priority reminder conflicts within same hour
  const highPrioritySameHour = existingReminders.filter(r => 
    r.priority === ReminderPriority.HIGH && 
    isSameDay(r.dueDate, validDate) &&
    r.dueDate.getHours() === validDate.getHours()
  );
  
  if (highPrioritySameHour.length > 0) {
    conflicts.push({
      reason: `Conflicts with ${highPrioritySameHour.length} high priority reminders at the same time`,
      severity: 'high'
    });
  }
  
  // Check for weekend conflicts for work categories
  if (isWeekend(validDate)) {
    if ([ReminderCategory.MEETING, ReminderCategory.COMMUNICATION].includes(ReminderCategory.MEETING)) {
      conflicts.push({
        reason: "Professional activities scheduled on weekend",
        severity: 'low'
      });
    }
  }
  
  return conflicts;
}

/**
 * Optimize workload distribution across days
 * @returns Suggested distribution of dates
 */
export function optimizeWorkloadDistribution(
  reminders: { category: ReminderCategory; priority: ReminderPriority; estimatedMinutes?: number }[],
  daysToDistribute: number = 5
): Map<string, Date> {
  const distribution = new Map<string, Date>();
  const today = startOfToday();
  const maxMinutesPerDay = 120; // 2 hours of focused work per day
  
  // Track allocated minutes per day
  const allocatedMinutes: { [key: string]: number } = {};
  for (let i = 0; i < daysToDistribute; i++) {
    const day = addDays(today, i);
    allocatedMinutes[day.toISOString().split('T')[0]] = 0;
  }
  
  // Sort reminders by priority (high to low)
  const sortedReminders = [...reminders].sort((a, b) => {
    const priorityOrder = { [ReminderPriority.HIGH]: 0, [ReminderPriority.MEDIUM]: 1, [ReminderPriority.LOW]: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Allocate reminders to days
  for (let i = 0; i < sortedReminders.length; i++) {
    const reminder = sortedReminders[i];
    const id = `reminder-${i}`;
    const minutes = reminder.estimatedMinutes || getDefaultEstimateForCategory(reminder.category);
    
    // Find the day with least allocated time
    let bestDay = today;
    let minAllocated = Infinity;
    
    for (let j = 0; j < daysToDistribute; j++) {
      const day = addDays(today, j);
      const dayKey = day.toISOString().split('T')[0];
      
      // High priority should be allocated to today if possible
      if (reminder.priority === ReminderPriority.HIGH && j === 0 && 
          allocatedMinutes[dayKey] + minutes <= maxMinutesPerDay * 1.2) { // Allow 20% overallocation for high priority
        bestDay = day;
        break;
      }
      
      // Otherwise distribute based on workload
      if (allocatedMinutes[dayKey] < minAllocated) {
        minAllocated = allocatedMinutes[dayKey];
        bestDay = day;
      }
    }
    
    // Allocate to the best day
    const dayKey = bestDay.toISOString().split('T')[0];
    allocatedMinutes[dayKey] += minutes;
    
    // Set time based on category preferences
    const allocatedDate = new Date(bestDay);
    
    switch (reminder.category) {
      case ReminderCategory.MEETING:
        allocatedDate.setHours(10, 0, 0, 0); // Morning meetings
        break;
      case ReminderCategory.GRADING:
        allocatedDate.setHours(15, 0, 0, 0); // Afternoon grading
        break;
      case ReminderCategory.COMMUNICATION:
        allocatedDate.setHours(13, 0, 0, 0); // Lunch time communication
        break;
      default:
        allocatedDate.setHours(9, 0, 0, 0); // Default morning
    }
    
    distribution.set(id, allocatedDate);
  }
  
  return distribution;
}

/**
 * Get default time estimate based on reminder category
 */
function getDefaultEstimateForCategory(category: ReminderCategory): number {
  switch (category) {
    case ReminderCategory.MEETING:
      return 60;
    case ReminderCategory.GRADING:
      return 90;
    case ReminderCategory.PREPARATION:
      return 45;
    case ReminderCategory.COMMUNICATION:
      return 20;
    case ReminderCategory.DEADLINE:
      return 15;
    default:
      return 30;
  }
}
