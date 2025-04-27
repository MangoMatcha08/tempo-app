
import { useState, useCallback } from 'react';
import { validateDate } from '@/utils/dateValidation';

export function useReminderDateValidation() {
  const [dateErrors, setDateErrors] = useState<string[]>([]);
  
  const validateDateAndTime = useCallback((date: Date | undefined, time: string | undefined) => {
    const errors: string[] = [];
    
    if (!date) {
      errors.push('Due date is required');
    }
    
    if (date) {
      const dateValidation = validateDate(date, {
        required: true,
        minDate: new Date()
      });

      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors.map(error => error.message));
      }
    }
    
    setDateErrors(errors);
    return errors.length === 0;
  }, []);

  return {
    dateErrors,
    validateDateAndTime,
    clearErrors: () => setDateErrors([])
  };
}
