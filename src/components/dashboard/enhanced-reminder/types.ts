
/**
 * Type definitions for the Enhanced Reminder components
 */
import { ReminderCategory, ReminderPriority, ChecklistItem, CreateReminderInput } from "@/types/reminderTypes";
import { Reminder as UIReminder } from "@/types/reminder";

/**
 * Props for the main ReminderForm component
 */
export interface ReminderFormProps {
  /**
   * Optional callback when a reminder is created
   * @param reminder The created reminder object
   */
  onReminderCreated?: (reminder: UIReminder) => void;
  
  /**
   * Optional callback when the form is cancelled
   */
  onCancel?: () => void;
}

/**
 * Props for the ReminderHeader component
 */
export interface ReminderHeaderProps {
  /**
   * Current view mode
   */
  viewMode: 'simple' | 'detailed';
  
  /**
   * Callback to toggle the view mode
   */
  toggleViewMode: () => void;
}

/**
 * Props for the BasicFormFields component
 */
export interface BasicFormFieldsProps {
  /**
   * Current reminder title
   */
  title: string;
  
  /**
   * Callback to update the title
   */
  setTitle: (title: string) => void;
  
  /**
   * Current priority
   */
  priority: ReminderPriority;
  
  /**
   * Callback to update the priority
   */
  setPriority: (priority: ReminderPriority) => void;
  
  /**
   * Current category
   */
  category: ReminderCategory;
  
  /**
   * Callback to update the category
   */
  setCategory: (category: ReminderCategory) => void;
  
  /**
   * Current period ID
   */
  periodId: string | undefined;
  
  /**
   * Callback to update the period ID
   */
  setPeriodId: (periodId: string | undefined) => void;
}

/**
 * Props for the DetailedFormFields component
 */
export interface DetailedFormFieldsProps {
  /**
   * Current description
   */
  description: string;
  
  /**
   * Callback to update the description
   */
  setDescription: (description: string) => void;
  
  /**
   * Current due date
   */
  dueDate: Date | undefined;
  
  /**
   * Callback to update the due date
   */
  setDueDate: (date: Date | undefined) => void;
  
  /**
   * Current due time string
   */
  dueTime: string | undefined;
  
  /**
   * Callback to update the due time
   */
  setDueTime: (time: string | undefined) => void;
}

/**
 * Props for the ChecklistSection component
 */
export interface ChecklistSectionProps {
  /**
   * Current checklist items
   */
  checklist: ChecklistItem[];
  
  /**
   * Callback to update the entire checklist
   */
  setChecklist: (checklist: ChecklistItem[]) => void;
  
  /**
   * Whether the checklist is currently shown
   */
  showChecklist: boolean;
  
  /**
   * Callback to toggle checklist visibility
   */
  setShowChecklist: (show: boolean) => void;
}

/**
 * Props for the FormActions component
 */
export interface FormActionsProps {
  /**
   * Callback to handle form submission
   */
  handleCreateReminder: () => void;
  
  /**
   * Callback to reset the form
   */
  resetForm: () => void;
  
  /**
   * Optional callback to cancel the form
   */
  onCancel?: () => void;
  
  /**
   * Whether the form is valid and can be submitted
   */
  isFormValid: boolean;
}
