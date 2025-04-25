import { useState, useCallback, useMemo, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { useEnhancedDate } from './useEnhancedDate';
import { useDateOperations } from './useDateOperations';
import { parseStringToDate, formatWithTimezone } from '@/utils/dateTransformations';
import { convertToUtc, convertToLocal } from '@/utils/dateTimeUtils';
import { ensureValidDate } from '@/utils/enhancedDateUtils';
import { datePerformance } from '@/utils/datePerformanceMonitor';
import { validateDate, DateValidationOptions } from '@/utils/dateValidation';
import { debugDate, generateDateDebugReport } from '@/utils/dateDebugUtils';

/**
 * Hook for integrating all date utilities in components
 */
export const useDateIntegration = (options: {
  initialDate?: Date | string;
  enablePerformanceMonitoring?: boolean;
  validationOptions?: DateValidationOptions;
}) => {
  const {
    initialDate = new Date(),
    enablePerformanceMonitoring = false,
    validationOptions = {}
  } = options;
  
  // Enable/disable performance monitoring
  useEffect(() => {
    datePerformance.enable(enablePerformanceMonitoring);
    return () => {
      datePerformance.enable(false);
    };
  }, [enablePerformanceMonitoring]);
  
  // Parse and validate initial date
  const parsedInitialDate = useMemo(() => {
    if (typeof initialDate === 'string') {
      // Measure parse performance
      return datePerformance.measureParse(() => {
        const date = parseStringToDate(initialDate);
        return date || new Date();
      }, { source: 'initialDate' });
    }
    return ensureValidDate(initialDate);
  }, [initialDate]);
  
  // Initialize hooks
  const enhancedDate = useEnhancedDate(parsedInitialDate);
  const dateOps = useDateOperations();
  
  // State for validation
  const [dateValidation, setDateValidation] = useState(() => 
    validateDate(parsedInitialDate, validationOptions)
  );
  
  /**
   * Parse a date string with performance tracking
   */
  const parseDate = useCallback((dateString: string) => {
    return datePerformance.measureParse(() => {
      const parsed = parseStringToDate(dateString);
      const validation = validateDate(parsed, validationOptions);
      setDateValidation(validation);
      return validation.sanitizedValue || new Date();
    }, { input: dateString });
  }, [validationOptions]);
  
  /**
   * Format a date with performance tracking
   */
  const formatDate = useCallback((date: Date, formatStr?: string) => {
    return datePerformance.measureFormat(() => {
      return formatWithTimezone(date, formatStr);
    }, { date: date.toISOString(), format: formatStr });
  }, []);
  
  /**
   * Handle date changes in form inputs
   */
  const handleDateChange = useCallback((
    dateString: string,
    dateFormat: string = 'yyyy-MM-dd'
  ) => {
    let date: Date | null = null;
    
    try {
      // First try to parse with date-fns
      const parsedDate = parse(dateString, dateFormat, new Date());
      if (isValid(parsedDate)) {
        date = parsedDate;
      } else {
        // Fallback to our flexible parser
        date = parseStringToDate(dateString);
      }
    } catch (e) {
      console.error('Error parsing date:', e);
    }
    
    // Validate the parsed date
    const validation = validateDate(date, validationOptions);
    setDateValidation(validation);
    
    // Update the date in the enhanced date hook
    if (validation.sanitizedValue) {
      enhancedDate.setSelectedDate(validation.sanitizedValue);
    }
    
    return validation;
  }, [enhancedDate.setSelectedDate, validationOptions]);
  
  /**
   * Save date to external system (e.g., database)
   */
  const saveDateToSystem = useCallback((date: Date) => {
    // Convert to UTC for storage
    const utcDate = convertToUtc(date);
    return utcDate.toISOString();
  }, []);
  
  /**
   * Load date from external system
   */
  const loadDateFromSystem = useCallback((isoString: string) => {
    try {
      // Parse ISO string to Date
      const date = parseISO(isoString);
      // Convert to local timezone for display
      return convertToLocal(date);
    } catch (e) {
      console.error('Error loading date from system:', e);
      return new Date();
    }
  }, []);
  
  /**
   * Get performance tips based on current usage
   */
  const getPerformanceTips = useCallback(() => {
    if (!enablePerformanceMonitoring) return [];
    return datePerformance.dateOptimizationTips.analyzeDateOperations();
  }, [enablePerformanceMonitoring]);
  
  // Reset monitoring when component unmounts
  useEffect(() => {
    return () => {
      if (enablePerformanceMonitoring) {
        datePerformance.reset();
      }
    };
  }, [enablePerformanceMonitoring]);
  
  return {
    // Date state
    date: enhancedDate.selectedDate,
    setDate: enhancedDate.setSelectedDate,
    
    // Validation state
    dateValidation,
    isDateValid: dateValidation.isValid,
    dateErrors: dateValidation.errors,
    
    // Core operations
    parseDate,
    formatDate,
    handleDateChange,
    
    // System integration
    saveDateToSystem,
    loadDateFromSystem,
    
    // Advanced features
    setupRecurrence: enhancedDate.setupRecurrence,
    occurrenceDates: enhancedDate.occurrenceDates,
    
    // Period integration
    formatWithPeriod: dateOps.formatWithPeriod,
    getTimeDisplay: dateOps.getTimeDisplay,
    
    // Performance monitoring
    getPerformanceTips,
  };
};

/**
 * Hook for debugging date issues
 */
export const useDateDebugger = (dateValue: Date | string | null | undefined) => {
  const dateInfo = useMemo(() => {
    if (!dateValue) return { isValid: false, message: 'No date provided' };
    
    try {
      const date = typeof dateValue === 'string' 
        ? parseStringToDate(dateValue) 
        : dateValue;
      
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return { 
          isValid: false, 
          message: 'Invalid date', 
          originalValue: dateValue 
        };
      }
      
      return {
        isValid: true,
        dateObject: date,
        iso: date.toISOString(),
        utc: format(convertToUtc(date), 'yyyy-MM-dd HH:mm:ss XXX'),
        local: format(date, 'yyyy-MM-dd HH:mm:ss XXX'),
        timestamp: date.getTime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (e) {
      return { 
        isValid: false, 
        message: `Error analyzing date: ${e instanceof Error ? e.message : String(e)}`,
        originalValue: dateValue
      };
    }
  }, [dateValue]);
  
  return dateInfo;
};
