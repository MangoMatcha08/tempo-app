import { v4 as uuidv4 } from 'uuid';
import { 
  Reminder, 
  CreateReminderInput, 
  ReminderPriority, 
  ReminderCategory,
  ChecklistItem
} from '../types/reminderTypes';

// Default schedule
export const mockPeriods = [
  { id: "p1", name: "Before school", startTime: "8:00", endTime: "8:50" },
  { id: "p2", name: "Period 1", startTime: "8:50", endTime: "9:50" },
  { id: "p3", name: "Break", startTime: "9:50", endTime: "10:05" },
  { id: "p4", name: "Period 2", startTime: "10:08", endTime: "11:08" },
  { id: "p5", name: "Period 3", startTime: "11:11", endTime: "12:11" },
  { id: "p6", name: "Period 4", startTime: "12:14", endTime: "1:14" },
  { id: "p7", name: "Lunch", startTime: "1:14", endTime: "1:44" },
  { id: "p8", name: "Period 5", startTime: "1:47", endTime: "2:47" },
  { id: "p9", name: "Period 6", startTime: "2:50", endTime: "3:30" },
  { id: "p10", name: "After School", startTime: "3:30", endTime: "5:00" }
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
