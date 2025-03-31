
import { v4 as uuidv4 } from 'uuid';
import { 
  Reminder, 
  CreateReminderInput, 
  ReminderPriority, 
  ReminderCategory 
} from '../types/reminderTypes';

// Mock periods for testing/demo
export const mockPeriods = [
  { id: "p1", name: "Period 1", startTime: "8:00", endTime: "8:50" },
  { id: "p2", name: "Period 2", startTime: "9:00", endTime: "9:50" },
  { id: "p3", name: "Period 3", startTime: "10:00", endTime: "10:50" },
  { id: "p4", name: "Lunch", startTime: "11:00", endTime: "11:45" },
  { id: "p5", name: "Period 4", startTime: "12:00", endTime: "12:50" },
  { id: "p6", name: "Planning", startTime: "13:00", endTime: "13:50" },
  { id: "p7", name: "Period 5", startTime: "14:00", endTime: "14:50" }
];

// Helper function to create a new reminder
export const createReminder = (input: CreateReminderInput): Reminder => {
  // Set default date to current time if not provided
  const now = new Date();
  
  // Create a new reminder object
  const newReminder: Reminder = {
    id: uuidv4(),
    title: input.title,
    description: input.description || "",
    dueDate: now,
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
      id: uuidv4()
    })) : undefined
  };
  
  return newReminder;
};
