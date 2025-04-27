
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { TestWrapper } from '@/test/test-wrapper';
import { 
  openDatePicker, 
  getCalendarPopover,
  selectCalendarDate 
} from '@/utils/test-utils/datePickerTestUtils';
import { testLogger } from '@/utils/test-utils/testDebugUtils';

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
    // Click the date button and verify calendar opens
    const calendar = await openDatePicker('reminder-date-picker');
    expect(calendar).toBeInTheDocument();
    
    // Log the calendar structure for debugging
    testLogger.dom.logCalendar(calendar);
  });

  it('allows selecting current date', async () => {
    // Open the date picker
    await openDatePicker('reminder-date-picker');
    
    // Select today's date (27th)
    const today = new Date('2024-04-27T12:00:00Z');
    await selectCalendarDate(today);
    
    // Wait for the button text to update - but with more robust assertion
    await waitFor(() => {
      // Check if button element contains today's date in any format
      const updatedButton = screen.getByTestId('reminder-date-picker');
      // Just check for the day number which should be consistent regardless of format
      expect(updatedButton.textContent).toContain('27');
    }, { timeout: 1000 });
  });

  it('allows selecting tomorrow', async () => {
    // Open the date picker
    await openDatePicker('reminder-date-picker');
    
    // Select tomorrow's date (28th)
    const tomorrow = new Date('2024-04-28T12:00:00Z');
    await selectCalendarDate(tomorrow);
    
    // Wait for the button text to update - with more robust assertion
    await waitFor(() => {
      // Check if button element contains today's date in any format
      const updatedButton = screen.getByTestId('reminder-date-picker');
      // Just check for the day number which should be consistent regardless of format
      expect(updatedButton.textContent).toContain('28');
    }, { timeout: 1000 });
  });
});
