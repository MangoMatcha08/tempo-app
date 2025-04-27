
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    vi.clearAllMocks();
    render(
      <TestWrapper>
        <QuickReminderModal {...defaultProps} />
      </TestWrapper>
    );
  });

  it('displays current date by default', async () => {
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
  });

  it('opens calendar on date picker click', async () => {
    const dateButton = screen.getByTestId('reminder-date-picker');
    
    // Click the date button and verify calendar opens
    await openDatePicker('reminder-date-picker');
    
    // Wait for calendar to appear and verify
    const calendar = await getCalendarPopover();
    expect(calendar).toBeInTheDocument();
    
    // Log the calendar structure for debugging
    testLogger.dom.logCalendar(calendar);
  });

  it('allows selecting current date', async () => {
    const today = new Date();
    
    // Open the date picker and select today's date
    await openDatePicker('reminder-date-picker');
    await selectCalendarDate(today);
    
    // Verify the date was selected
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(today, 'PPP'));
    }, { timeout: 2000 });
  });

  it('allows selecting tomorrow', async () => {
    const tomorrow = addDays(new Date(), 1);
    
    // Open the date picker and select tomorrow's date
    await openDatePicker('reminder-date-picker');
    await selectCalendarDate(tomorrow);
    
    // Verify the date was selected
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(tomorrow, 'PPP'));
    }, { timeout: 2000 });
  });
});
