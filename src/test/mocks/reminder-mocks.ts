
import { DatabaseReminder } from '@/types/reminderTypes';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

export const createMockReminder = (overrides?: Partial<DatabaseReminder>): DatabaseReminder => ({
  id: 'test-reminder-1',
  title: 'Test Reminder',
  description: 'Test Description',
  dueDate: new Date(),
  priority: ReminderPriority.MEDIUM,
  category: ReminderCategory.TASK,
  periodId: null,
  completed: false,
  completedAt: null,
  createdAt: new Date(),
  userId: 'test-user',
  checklist: null,
  ...overrides
});
