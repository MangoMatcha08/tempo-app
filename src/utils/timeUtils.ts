/**
 * Formats a date into a readable time string
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats a date into a full date string
 */
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Gets the difference between two dates in days
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  // Convert to UTC dates to avoid timezone issues
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  // Convert to days
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
};

/**
 * Checks if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Formats time with school period context
 * Returns period name with time in parentheses
 */
export function formatTimeWithPeriod(date: Date, periodId?: string): string {
  console.log('[formatTimeWithPeriod] Input:', { 
    date: date.toISOString(), 
    periodId 
  });
  
  // If we have a period ID, use the period's defined time
  if (periodId) {
    const period = mockPeriods.find(p => p.id === periodId);
    
    if (period) {
      console.log('[formatTimeWithPeriod] Found period:', period);
      
      // Use the period's start time if available
      if (period.startTime) {
        // Extract hours and minutes from period start time
        const [hours, minutes] = period.startTime.split(':').map(Number);
        
        // Create a formatted time string for display
        const periodTime = format(
          new Date().setHours(hours, minutes, 0, 0), 
          'h:mm a'
        );
        
        console.log(`[formatTimeWithPeriod] Using period time: ${periodTime}`);
        return `${period.name} (${periodTime})`;
      }
    }
  }
  
  // If no period found or no start time, fall back to the reminder's own time
  const formattedTime = format(date, 'h:mm a');
  console.log(`[formatTimeWithPeriod] Using reminder time: ${formattedTime}`);
  
  // Try to find matching period for this time
  const hours = date.getHours();
  const period = mockPeriods.find(p => {
    const [startHour] = p.startTime.split(':').map(Number);
    const [endHour] = p.endTime.split(':').map(Number);
    return hours >= startHour && hours < endHour;
  });
  
  if (period) {
    return `${period.name} (${formattedTime})`;
  }
  
  return formattedTime;
}

/**
 * Gets priority color class based on priority level
 */
export const getPriorityColorClass = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'text-red-500 bg-red-50';
    case 'medium':
      return 'text-amber-500 bg-amber-50';
    case 'low':
      return 'text-blue-500 bg-blue-50';
    default:
      return 'text-slate-500 bg-slate-50';
  }
};

/**
 * Gets border color class based on priority level
 */
export const getPriorityBorderClass = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'border-red-500';
    case 'medium':
      return 'border-amber-500';
    case 'low':
      return 'border-blue-500';
    default:
      return 'border-slate-500';
  }
};
