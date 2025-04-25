// Note: 'location' and 'type' fields were removed in April 2025 to streamline the data model
// and resolve type inconsistencies across the application

import { v4 as uuidv4 } from 'uuid';
import { 
  Reminder, 
  CreateReminderInput, 
  ReminderPriority, 
  ReminderCategory,
  ChecklistItem,
  DatabaseReminder 
} from '../types/reminderTypes';

// Mock periods for testing/demo
export const mockPeriods = [
  { id: "before-school", name: "Before School", startTime: "8:00", endTime: "8:50" },
  { id: "1", name: "Period 1", startTime: "8:50", endTime: "9:50" },
  { id: "break", name: "Break", startTime: "9:50", endTime: "10:05" },
  { id: "2", name: "Period 2", startTime: "10:08", endTime: "11:08" },
  { id: "3", name: "Period 3", startTime: "11:11", endTime: "12:11" },
  { id: "4", name: "Period 4", startTime: "12:14", endTime: "13:14" },
  { id: "lunch", name: "Lunch", startTime: "13:14", endTime: "13:44" },
  { id: "5", name: "Period 5", startTime: "13:47", endTime: "14:47" },
  { id: "6", name: "Period 6", startTime: "14:50", endTime: "15:30" },
  { id: "after-school", name: "After School", startTime: "15:30", endTime: "17:00" }
];

// Helper function to create a new reminder
export function createReminder(input: CreateReminderInput): DatabaseReminder {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description || "",
    dueDate: input.dueDate || now,
    priority: input.priority || ReminderPriority.MEDIUM,
    completed: false,
    completedAt: null,
    createdAt: now,
    category: input.category || null,
    periodId: input.periodId || null,
    checklist: input.checklist || null,
    userId: input.userId || ""
  };
}

// Helper function to get period name by ID
export const getPeriodNameById = (periodId: string): string => {
  const period = mockPeriods.find(p => p.id === periodId);
  return period ? period.name : "Unknown Period";
};

// Helper function to format priority
export const formatPriority = (priority: ReminderPriority | string): string => {
  switch (priority) {
    case ReminderPriority.HIGH:
      return "High Priority";
    case ReminderPriority.MEDIUM:
      return "Medium Priority";
    case ReminderPriority.LOW:
      return "Low Priority";
    default:
      return "Medium Priority";
  }
};

// Helper function to format category
export const formatCategory = (category?: ReminderCategory | string): string => {
  if (!category) return "Task";
  
  switch (category) {
    case ReminderCategory.TASK:
      return "Task";
    case ReminderCategory.MEETING:
      return "Meeting";
    case ReminderCategory.DEADLINE:
      return "Deadline";
    case ReminderCategory.PREPARATION:
      return "Preparation";
    case ReminderCategory.GRADING:
      return "Grading";
    case ReminderCategory.COMMUNICATION:
      return "Communication";
    default:
      return "Task";
  }
};

// Helper function to generate a unique ID
export const generateId = (): string => {
  return uuidv4();
};
