
import { v4 as uuidv4 } from 'uuid';
import { 
  Reminder, 
  CreateReminderInput, 
  ReminderPriority, 
  ReminderCategory,
  ChecklistItem
} from '../types/reminderTypes';

// Mock periods for testing/demo
export const mockPeriods = [
  { id: "p1", name: "Period 1", startTime: "8:00", endTime: "8:50" },
  { id: "p2", name: "Period 2", startTime: "9:00", endTime: "9:50" },
  { id: "p3", name: "Period 3", startTime: "10:00", endTime: "10:50" },
  { id: "p4", name: "Lunch", startTime: "11:00", endTime: "11:45" },
  { id: "p5", name: "Period 4", startTime: "12:00", endTime: "12:50" },
  { id: "p6", name: "Planning", startTime: "13:00", endTime: "13:50" },
  { id: "p7", name: "Period 5", startTime: "14:00", endTime: "14:50" },
  { id: "p8", name: "Before School", startTime: "7:00", endTime: "8:00" },
  { id: "p9", name: "After School", startTime: "15:00", endTime: "16:00" },
  { id: "p10", name: "Prep Period", startTime: "13:00", endTime: "13:50" }
];

// Helper function to create a new reminder
export const createReminder = (input: CreateReminderInput): Reminder => {
  console.log("Creating reminder from input:", input);
  
  // Set default date to today if not provided
  const now = new Date();
  const today = new Date(now);
  today.setHours(9, 0, 0, 0); // Set to 9:00 AM today as default
  
  // For proper ID generation
  const generateId = () => uuidv4();
  
  // Create a new reminder object
  const newReminder: Reminder = {
    id: generateId(),
    title: input.title,
    description: input.description || "",
    // Use detected date if available, otherwise use today
    dueDate: input.dueDate || today,
    priority: input.priority || ReminderPriority.MEDIUM,
    completed: false,
    category: input.category,
    periodId: input.periodId,
    location: input.periodId ? 
      mockPeriods.find(p => p.id === input.periodId)?.name || 
      (input.detectedNewPeriod ? input.detectedNewPeriod.name : undefined) : 
      undefined,
    checklist: input.checklist ? input.checklist.map(item => ({
      ...item,
      id: item.id || generateId()
    })) : undefined
  };
  
  console.log("Created reminder:", newReminder);
  return newReminder;
};

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
