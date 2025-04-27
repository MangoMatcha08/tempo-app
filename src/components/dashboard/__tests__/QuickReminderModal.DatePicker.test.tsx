
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { TestWrapper } from '@/test/test-wrapper';
import { 
  openDatePicker, 
  getCalendarPopover,
  selectCalendarDate 
} from '@/utils/test-utils/datePickerTestUtils';
import { testLogger } from '@/utils/test-utils/testDebugUtils';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

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
    
    // Get calendar element
    const calendar = await getCalendarPopover();
    
    // Find all day buttons (they have role="gridcell")
    const days = within(calendar).getAllByRole('gridcell');
    
    // Find the "27" day button (today)
    const dayText = '27';
    const dayButton = Array.from(days).find(day => 
      day.textContent?.trim() === dayText
    );
    
    // Verify we found it
    expect(dayButton).toBeDefined();
    
    if (dayButton) {
      // Click the day button
      await act(async () => {
        await userEvent.click(dayButton);
      });
      
      // Verify the button text updated
      await waitFor(() => {
        const updatedButton = screen.getByTestId('reminder-date-picker');
        expect(updatedButton.textContent).toContain('27');
      }, { timeout: 1000 });
    }
  });

  it('allows selecting tomorrow', async () => {
    // Open the date picker
    await openDatePicker('reminder-date-picker');
    
    // Get calendar element
    const calendar = await getCalendarPopover();
    
    // Find all day buttons (they have role="gridcell")
    const days = within(calendar).getAllByRole('gridcell');
    
    // Find the "28" day button (tomorrow)
    const dayText = '28';
    const dayButton = Array.from(days).find(day => 
      day.textContent?.trim() === dayText
    );
    
    // Verify we found it
    expect(dayButton).toBeDefined();
    
    if (dayButton) {
      // Click the day button
      await act(async () => {
        await userEvent.click(dayButton);
      });
      
      // Verify the button text updated
      await waitFor(() => {
        const updatedButton = screen.getByTestId('reminder-date-picker');
        expect(updatedButton.textContent).toContain('28');
      }, { timeout: 1000 });
    }
  });
});
