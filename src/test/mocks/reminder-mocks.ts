
import { Reminder } from '@/types/reminder';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

export const createMockReminder = (overrides?: Partial<Reminder>): Reminder => ({
  id: 'test-reminder-1',
  title: 'Test Reminder',
  description: 'Test Description',
  dueDate: new Date(),
  dueTime: '15:00',
  priority: ReminderPriority.MEDIUM,
  category: ReminderCategory.TASK,
  periodId: null,
  isCompleted: false,
  userId: 'test-user',
  created: new Date(),
  updated: new Date(),
  ...overrides
});
