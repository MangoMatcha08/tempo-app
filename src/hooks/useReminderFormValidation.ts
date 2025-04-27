
import { useState } from 'react';
import { validateDate } from '@/utils/dateValidation';
import { Reminder } from '@/types/reminder';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import { parseTimeString, createDateWithTime } from '@/utils/dateUtils';

interface ReminderFormState {
  title: string;
  description: string;
  priority: ReminderPriority;
  category: ReminderCategory;
  periodId: string;
  dueDate?: Date;
  dueTime?: string;
}

interface ReminderFormValidation {
  formState: ReminderFormState;
  validationErrors: string[];
  updateField: <K extends keyof ReminderFormState>(field: K, value: ReminderFormState[K]) => void;
  resetForm: (reminder: Reminder) => void;
  validateAndSave: () => { isValid: boolean; updatedReminder?: Reminder };
}

export function useReminderFormValidation(reminder: Reminder | null): ReminderFormValidation {
  const [formState, setFormState] = useState<ReminderFormState>({
    title: reminder?.title || '',
    description: reminder?.description || '',
    priority: reminder?.priority || ReminderPriority.MEDIUM,
    category: reminder?.category || ReminderCategory.TASK,
    periodId: reminder?.periodId || 'none',
    dueDate: reminder?.dueDate,
    dueTime: reminder?.dueDate ? format(reminder.dueDate, 'HH:mm') : undefined
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const updateField = <K extends keyof ReminderFormState>(field: K, value: ReminderFormState[K]) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]); // Clear errors when field is updated
  };

  const resetForm = (reminder: Reminder) => {
    setFormState({
      title: reminder.title,
      description: reminder.description,
      priority: reminder.priority,
      category: reminder.category,
      periodId: reminder.periodId || 'none',
      dueDate: reminder.dueDate,
      dueTime: format(reminder.dueDate, 'HH:mm')
    });
    setValidationErrors([]);
  };

  const validateAndSave = () => {
    const errors: string[] = [];
    
    if (!reminder || !formState.title.trim()) {
      errors.push('Title is required');
    }
    
    if (!formState.dueDate) {
      errors.push('Due date is required');
    }

    if (formState.dueDate) {
      const dateValidation = validateDate(formState.dueDate, {
        required: true,
        minDate: new Date()
      });

      if (!dateValidation.isValid) {
        errors.push(...dateValidation.errors.map(error => error.message));
      }
    }

    setValidationErrors(errors);

    if (errors.length > 0 || !reminder || !formState.dueDate) {
      return { isValid: false };
    }

    let finalDueDate = new Date(formState.dueDate);
    
    if (formState.dueTime) {
      const timeComponents = parseTimeString(formState.dueTime);
      if (timeComponents) {
        finalDueDate = createDateWithTime(finalDueDate, timeComponents.hours, timeComponents.minutes);
      }
    }

    const updatedReminder: Reminder = {
      ...reminder,
      title: formState.title,
      description: formState.description,
      priority: formState.priority,
      category: formState.category,
      periodId: formState.periodId === 'none' ? null : formState.periodId,
      dueDate: finalDueDate
    };

    return { isValid: true, updatedReminder };
  };

  return {
    formState,
    validationErrors,
    updateField,
    resetForm,
    validateAndSave
  };
}
