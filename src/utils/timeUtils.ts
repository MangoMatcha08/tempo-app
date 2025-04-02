
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
export const formatTimeWithPeriod = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeStr = formatTime(date);
  
  // Determine school period based on time
  if (hours < 8) {
    return `Before School (${timeStr})`;
  } else if (hours < 9) {
    return `1st Period (${timeStr})`;
  } else if (hours < 10) {
    return `2nd Period (${timeStr})`;
  } else if (hours < 11) {
    return `3rd Period (${timeStr})`;
  } else if (hours < 12) {
    return `4th Period (${timeStr})`;
  } else if (hours < 13) {
    return `Lunch (${timeStr})`;
  } else if (hours < 14) {
    return `5th Period (${timeStr})`;
  } else if (hours < 15) {
    return `6th Period (${timeStr})`;
  } else {
    return `After School (${timeStr})`;
  }
};

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
