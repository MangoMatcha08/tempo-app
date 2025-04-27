
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { TestWrapper } from '@/test/test-wrapper';
import { openDatePicker, selectCalendarDate, getCalendarPopover } from '@/utils/test-utils/datePickerTestUtils';

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
  });

  // Re-enable these tests once we've fixed the date picker utilities
  it('allows selecting current date', async () => {
    const today = new Date();
    
    // Open the date picker
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Wait for calendar to appear
    await getCalendarPopover();
    
    // Select today's date
    await selectCalendarDate(today);
    
    // Verify the date was selected
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(today, 'PPP'));
    }, { timeout: 5000 });
  });

  it('allows selecting tomorrow', async () => {
    const tomorrow = addDays(new Date(), 1);
    
    // Open the date picker
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Wait for calendar to appear
    await getCalendarPopover();
    
    // Select tomorrow's date
    await selectCalendarDate(tomorrow);
    
    // Verify the date was selected
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(tomorrow, 'PPP'));
    }, { timeout: 5000 });
  });
});
