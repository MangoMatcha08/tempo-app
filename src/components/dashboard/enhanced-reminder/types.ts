
import { ChecklistItem, ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

export interface ReminderHeaderProps {
  viewMode: 'simple' | 'detailed';
  toggleViewMode: () => void;
}

export interface BasicFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  priority: ReminderPriority;
  setPriority: (priority: ReminderPriority) => void;
  category: ReminderCategory;
  setCategory: (category: ReminderCategory) => void;
  periodId?: string;
  setPeriodId: (periodId: string | undefined) => void;
}

export interface DetailedFormFieldsProps {
  description: string;
  setDescription: (description: string) => void;
  dueDate?: Date;
  setDueDate: (date?: Date) => void;
  dueTime?: string;
  setDueTime: (time?: string) => void;
  periodId?: string;
}

export interface ChecklistSectionProps {
  checklist: ChecklistItem[];
  setChecklist: (checklist: ChecklistItem[]) => void;
  showChecklist: boolean;
  setShowChecklist: (show: boolean) => void;
}

export interface FormActionsProps {
  handleCreateReminder: () => void;
  resetForm: () => void;
  onCancel?: () => void;
  isFormValid: boolean;
}

export interface ReminderFormProps {
  onReminderCreated?: (reminder: any) => void;
  onCancel?: () => void;
}
