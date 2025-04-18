
import { DatabaseReminder } from "@/types/reminderTypes";
import { ReminderPriority, ReminderCategory } from "@/types/reminderTypes";

export const getMockReminders = (userId: string): DatabaseReminder[] => {
  const now = new Date();
  
  return [
    {
      id: 'mock-1',
      userId,
      title: 'Grade student essays',
      description: 'Review and grade the latest batch of student essays',
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Due in 1 day
      priority: ReminderPriority.HIGH,
      category: ReminderCategory.TASK,
      completed: false,
      createdAt: now
    },
    {
      id: 'mock-2', 
      userId,
      title: 'Prepare lesson plan',
      description: 'Create comprehensive lesson plan for next week',
      dueDate: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Due in 2 days
      priority: ReminderPriority.MEDIUM,
      category: ReminderCategory.PREPARATION,
      completed: false,
      createdAt: now
    }
  ];
};

