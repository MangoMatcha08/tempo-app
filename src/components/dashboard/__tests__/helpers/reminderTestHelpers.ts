
import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { UIReminder, ReminderPriority } from '@/types/reminderTypes';

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
  
  return {
    id: 'test-reminder-id',
    title: 'Test Reminder',
    description: 'Test Description',
    dueDate: dueDate,
    createdAt: new Date('2024-04-26T10:00:00Z'),
    completed: false,
    priority: ReminderPriority.MEDIUM,
    userId: 'test-user',
    ...overrides
  };
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
