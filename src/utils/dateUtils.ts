
// Re-export everything from dateUtils for backward compatibility
export * from './dateUtils';

// Export additional period time utility
export function getPeriodTime(periodId: string, periods: any[]) {
  const period = periods.find(p => p.id === periodId);
  if (!period || !period.startTime) return null;
  
  const { parseTimeString } = require('./dateUtils/core');
  return parseTimeString(period.startTime);
}
