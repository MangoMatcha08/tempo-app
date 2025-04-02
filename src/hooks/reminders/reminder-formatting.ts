
/**
 * Helper functions for formatting dates and times for reminders
 */

/**
 * Formats the remaining time until a due date
 */
export function getRemainingTimeDisplay(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
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
export function getTimeAgoDisplay(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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
export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
