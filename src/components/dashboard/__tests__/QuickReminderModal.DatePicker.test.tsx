import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { selectDate } from '../../../utils/test-utils/datePickerTestUtils';

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
  });

  it('displays current date by default', () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
  });

  it('opens calendar on date picker click', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    const calendarDialog = await waitFor(() => screen.getByRole('dialog', { name: /calendar/i }));
    expect(calendarDialog).toBeInTheDocument();
  });

  it('allows selecting a future date', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const futureDate = addDays(new Date(), 32); // Move to next month
    await selectDate(futureDate);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(futureDate, 'PPP'));
  });

  it('persists selected date when calendar is reopened', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const futureDate = addDays(new Date(), 3);
    await selectDate(futureDate);
    
    // Verify the selected date is shown
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(futureDate, 'PPP'));
    
    // Close and reopen calendar
    fireEvent.click(dateButton);
    
    // Wait for calendar to reopen and verify selected date is highlighted
    const calendarDialog = await waitFor(() => screen.getByRole('dialog', { name: /calendar/i }));
    expect(calendarDialog).toBeInTheDocument();
    
    const selectedDay = within(calendarDialog).getByRole('gridcell', {
      selected: true,
    });
    expect(selectedDay).toHaveTextContent(format(futureDate, 'd'));
  });

  it('closes calendar when clicking outside', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Click outside (the modal background)
    const backdrop = screen.getByTestId('reminder-date-picker').closest('[role="dialog"]');
    if (!backdrop) throw new Error('Modal backdrop not found');
    fireEvent.click(backdrop);
    
    // Verify calendar is closed
    await waitFor(() => {
      const popoverContent = screen.queryByRole('dialog', { name: /calendar/i });
      expect(popoverContent).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    const calendarDialog = await waitFor(() => screen.getByRole('dialog', { name: /calendar/i }));
    expect(calendarDialog).toBeInTheDocument();
    
    // Find today's cell
    const today = new Date();
    const todayString = format(today, 'd');
    
    const calendar = within(calendarDialog);
    const todayCell = calendar.getByRole('gridcell', {
      name: new RegExp(`^${todayString}$`)
    });
    
    // Focus and navigate
    todayCell.focus();
    fireEvent.keyDown(todayCell, { key: 'ArrowRight' });
    
    // Find the next day cell
    const tomorrow = addDays(today, 1);
    const tomorrowCell = calendar.getByRole('gridcell', {
      name: format(tomorrow, 'd')
    });
    
    fireEvent.click(tomorrowCell);
    
    // Verify the date is selected
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(tomorrow, 'PPP'));
    });
  });
});
