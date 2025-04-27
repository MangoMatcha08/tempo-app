
import { vi } from 'vitest';

export const mockDate = (date: string | number | Date) => {
  const mockedDate = new Date(date);
  vi.useFakeTimers();
  vi.setSystemTime(mockedDate);
};

export const restoreDate = () => {
  vi.useRealTimers();
};
