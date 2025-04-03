import { v4 as uuidv4 } from 'uuid';
import { 
  Reminder, 
  CreateReminderInput, 
  ReminderPriority, 
  ReminderCategory,
  ChecklistItem
} from '../types/reminderTypes';

// Mock schedule for testing
export const mockPeriods = [
  { id: 'before-school', name: 'Before School', startTime: '7:30 AM', endTime: '8:00 AM' },
  { id: 'period-1', name: '1st Period', startTime: '8:00 AM', endTime: '8:50 AM' },
  { id: 'period-2', name: '2nd Period', startTime: '9:00 AM', endTime: '9:50 AM' },
  { id: 'period-3', name: '3rd Period', startTime: '10:00 AM', endTime: '10:50 AM' },
  { id: 'period-4', name: '4th Period', startTime: '11:00 AM', endTime: '11:50 AM' },
  { id: 'lunch', name: 'Lunch', startTime: '12:00 PM', endTime: '12:30 PM' },
  { id: 'period-5', name: '5th Period', startTime: '12:40 PM', endTime: '1:30 PM' },
  { id: 'period-6', name: '6th Period', startTime: '1:40 PM', endTime: '2:30 PM' },
  { id: 'after-school', name: 'After School', startTime: '2:30 PM', endTime: '4:00 PM' }
];

// Helper function to create a new reminder
export const createReminder = (input: CreateReminderInput): Reminder => {
  console.log("Creating reminder from input:", input);
  
  // For proper ID generation
  const generateId = () => uuidv4();
  
  // Create a new reminder object
  const newReminder: Reminder = {
    id: generateId(),
    title: input.title,
    description: input.description || "",
    // Use exact detected date if available, otherwise use today
    dueDate: input.dueDate ? new Date(input.dueDate) : new Date(),
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
  
  // If we have a period ID, set the due date time based on the period's start time
  if (input.periodId && input.periodId !== "none") {
    const period = mockPeriods.find(p => p.id === input.periodId);
    if (period && period.startTime) {
      const dueDate = new Date(newReminder.dueDate);
      
      // Parse the start time (handle both 24-hour and 12-hour formats)
      let [hours, minutes] = period.startTime.split(':').map(part => {
        // Handle cases like "1:14" (convert to 13:14)
        if (part.includes(":")) return part;
        
        const num = parseInt(part, 10);
        // If it's a single-digit hour in the afternoon (1-9), convert to 24-hour format
        if (num >= 1 && num <= 9 && period.startTime.indexOf(":") > 1) {
          return (num + 12).toString();
        }
        return part;
      });
      
      // Convert hours to number, handling 12-hour format
      let hoursNum = parseInt(hours, 10);
      if (hoursNum < 8 && period.startTime.indexOf(":") > 1) {
        hoursNum += 12; // Convert afternoon hours to 24-hour format
      }
      
      // Set the time on the due date
      dueDate.setHours(hoursNum, parseInt(minutes, 10), 0, 0);
      newReminder.dueDate = dueDate;
      
      console.log(`Set reminder time to period start time: ${dueDate.toLocaleTimeString()}`);
    }
  }
  
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

// Helper function to get period by time
export const getPeriodByTime = (time: Date): string | undefined => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  for (const period of mockPeriods) {
    // Parse start and end times
    const [startHours, startMinutes] = period.startTime.split(':').map(part => {
      const num = parseInt(part, 10);
      // If it's a single-digit hour in the afternoon (1-9), convert to 24-hour format
      if (num >= 1 && num <= 9 && period.startTime.indexOf(":") > 1) {
        return num + 12;
      }
      return num;
    });
    
    const [endHours, endMinutes] = period.endTime.split(':').map(part => {
      const num = parseInt(part, 10);
      // If it's a single-digit hour in the afternoon (1-9), convert to 24-hour format
      if (num >= 1 && num <= 9 && period.endTime.indexOf(":") > 1) {
        return num + 12;
      }
      return num;
    });
    
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;
    
    if (timeInMinutes >= startTimeInMinutes && timeInMinutes < endTimeInMinutes) {
      return period.id;
    }
  }
  
  return undefined;
};
