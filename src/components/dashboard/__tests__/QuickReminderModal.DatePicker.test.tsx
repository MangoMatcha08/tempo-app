
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { TestWrapper } from '@/test/test-wrapper';
import { openCalendar, selectDate } from '@/utils/test-utils/calendarTestUtils';

describe('QuickReminderModal DatePicker', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnReminderCreated = vi.fn();
  
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onReminderCreated: mockOnReminderCreated
  };
  
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Set a stable date for testing
    vi.setSystemTime(new Date('2024-04-27T12:00:00Z'));
    vi.clearAllMocks();
    
    render(
      <TestWrapper>
        <QuickReminderModal {...defaultProps} />
      </TestWrapper>
    );
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays current date by default', async () => {
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
  });

  it('opens calendar on date picker click', async () => {
    const calendar = await openCalendar('reminder-date-picker');
    expect(calendar).toBeInTheDocument();
  });

  it('allows selecting current date', async () => {
    const today = new Date('2024-04-27T12:00:00Z');
    await selectDate(today);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(today, 'PPP'));
  });

  it('allows selecting tomorrow', async () => {
    const tomorrow = new Date('2024-04-28T12:00:00Z');
    await selectDate(tomorrow);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(tomorrow, 'PPP'));
  });
});
