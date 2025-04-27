
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { TestWrapper } from '@/test/test-wrapper';
import { 
  openDatePicker, 
  selectCalendarDate, 
  getCalendarPopover, 
  findDayCell, 
  withRetry 
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
    fireEvent.click(dateButton);
    
    const calendar = await getCalendarPopover();
    expect(calendar).toBeInTheDocument();
    
    // Log the calendar structure for debugging
    testLogger.dom.logCalendar(calendar);
  });

  it('allows selecting current date', async () => {
    const today = new Date();
    
    // Open the date picker
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Wait for calendar to appear
    const calendar = await getCalendarPopover();
    
    // Find today's day cell and click it directly
    const dayCell = await findDayCell(today.getDate().toString());
    
    if (dayCell) {
      fireEvent.click(dayCell);
      
      // Verify the date was selected
      await waitFor(() => {
        const updatedButton = screen.getByTestId('reminder-date-picker');
        expect(updatedButton).toHaveTextContent(format(today, 'PPP'));
      }, { timeout: 5000 });
    } else {
      throw new Error(`Could not find day cell for date: ${today.getDate()}`);
    }
  });

  it('allows selecting tomorrow', async () => {
    const tomorrow = addDays(new Date(), 1);
    
    // Open the date picker
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Wait for calendar to appear
    const calendar = await getCalendarPopover();
    
    // Find tomorrow's day cell and click it directly
    const dayCell = await findDayCell(tomorrow.getDate().toString());
    
    if (dayCell) {
      fireEvent.click(dayCell);
      
      // Verify the date was selected
      await waitFor(() => {
        const updatedButton = screen.getByTestId('reminder-date-picker');
        expect(updatedButton).toHaveTextContent(format(tomorrow, 'PPP'));
      }, { timeout: 5000 });
    } else {
      throw new Error(`Could not find day cell for date: ${tomorrow.getDate()}`);
    }
  });
});
