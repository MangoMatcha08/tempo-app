
/**
 * Helper functions for formatting dates and times for reminders
 */

/**
 * Ensures a value is a valid Date object
 */
export function ensureValidDate(date: any): Date {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Handle Firestore Timestamp objects
  if (date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  // Handle ISO string dates
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  
  // If all else fails, return current date as fallback
  console.warn('Invalid date encountered, using current date as fallback', date);
  return new Date();
}

/**
 * Formats the remaining time until a due date
 */
export function getRemainingTimeDisplay(date: Date | any): string {
  const validDate = ensureValidDate(date);
  const now = new Date();
  const diffMs = validDate.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 0) return "Overdue";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

/**
 * Formats how long ago something happened
 */
export function getTimeAgoDisplay(date: Date | any): string {
  const validDate = ensureValidDate(date);
  const now = new Date();
  const diffMs = now.getTime() - validDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Formats date for display
 */
export function formatDate(date: Date | any): string {
  const validDate = ensureValidDate(date);
  return validDate.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
