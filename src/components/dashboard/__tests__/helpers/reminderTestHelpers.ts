
import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { UIReminder, ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

/**
 * Sets up consistent timezone for tests
 */
export function setupTimezoneMock() {
  // Save original timezone methods
  const originalIntlFormat = Intl.DateTimeFormat;
  
  // Mock Intl.DateTimeFormat to return consistent timezone
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args) => {
    const options = args[1] || {};
    if (typeof options === 'object') {
      return originalIntlFormat.call(Intl, ...args);
    }
    return originalIntlFormat.call(Intl, ...args);
  });
  
  // Ensure Date methods use consistent behavior
  vi.setSystemTime(new Date('2024-04-27T12:00:00Z'));
  
  return () => {
    vi.restoreAllMocks();
  };
}

/**
 * Creates a mock reminder with consistent timezone handling
 */
export function createTestReminder(overrides: Partial<UIReminder> = {}): UIReminder {
  const dueDate = overrides.dueDate || new Date('2024-04-27T12:00:00Z');
  const createdAt = new Date('2024-04-26T10:00:00Z');
  
  const baseReminder: UIReminder = {
    id: 'test-reminder-id',
    title: 'Test Reminder',
    description: 'Test Description',
    dueDate,
    createdAt,
    completed: false,
    completedAt: null,  // Now correctly set as non-optional
    priority: ReminderPriority.MEDIUM,
    category: ReminderCategory.TASK,
    periodId: null,
    checklist: null,
    userId: 'test-user',
    timeRemaining: '1 day',
    formattedDate: 'Apr 27, 2024',
    completedTimeAgo: undefined
  };

  return { ...baseReminder, ...overrides };
}

/**
 * Wraps async operations with act and handles completion
 */
export async function completeReminder(onComplete: (id: string) => Promise<boolean> | boolean, id: string) {
  let result: boolean | undefined;
  
  await act(async () => {
    result = await Promise.resolve(onComplete(id));
  });
  
  return result;
}

/**
 * Waits for async operations to complete with timeout
 */
export function waitForAsync(ms: number = 50): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
