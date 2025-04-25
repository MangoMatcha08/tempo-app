
import { useState, useCallback } from 'react';
import { validateDate, type DateValidationOptions, type DateValidationResult } from '@/utils/date/validation';

export function useDateValidation(defaultOptions: DateValidationOptions = {}) {
  const [lastResult, setLastResult] = useState<DateValidationResult | null>(null);
  
  const validate = useCallback((
    date: Date | string | null | undefined,
    options: DateValidationOptions = {}
  ) => {
    const result = validateDate(date, { ...defaultOptions, ...options });
    setLastResult(result);
    return result;
  }, [defaultOptions]);
  
  const reset = useCallback(() => {
    setLastResult(null);
  }, []);
  
  return {
    validate,
    reset,
    lastResult
  };
}
