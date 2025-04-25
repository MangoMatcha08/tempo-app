
/**
 * Date utilities index file - exports all date-related functionality
 */

// Export base transformations
export * from './dateTransformations';

// Export timezone utilities
export { convertToUtc, convertToLocal, parseTimeStringWithCompatibility } from './dateTimeUtils';

// Export enhanced utilities (without duplicates)
export { 
  ensureValidDate,
  getUserTimeZone,
  formatDateWithPeriod,
  getRelativeTimeDisplay,
  getNearestPeriodTime,
  formatDisplayDate 
} from './enhancedDateUtils';

// Export date time utilities (without duplicates)
export { 
  formatTimeString,
  formatDateRange,
  logDateDetails,
  parseFlexibleDateTime 
} from './dateTimeUtils';

// Export recurring pattern utilities
export * from './recurringDatePatterns';

// Export period management utilities
export * from './periodManagement';

// Export date suggestion utilities
export * from './dateSuggestions';

// Export date operations cache
export * from './dateOperationsCache';

// Default export for backward compatibility
import { parseStringToDate, formatDate } from './dateTransformations';
export default {
  parseStringToDate,
  formatDate
};
