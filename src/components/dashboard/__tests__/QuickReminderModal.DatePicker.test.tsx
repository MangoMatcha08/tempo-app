
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { selectDate, getCalendarDialog } from '../../../utils/test-utils/datePickerTestUtils';

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
    
    const calendarDialog = await waitFor(() => getCalendarDialog());
    expect(calendarDialog).toBeInTheDocument();
  });

  it('allows selecting a future date', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Test with a future date in a different month
    const futureDate = addDays(new Date(), 32); // Ensures we're in next month
    await selectDate(futureDate);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(futureDate, 'PPP'));
  });

  it('persists selected date when calendar is reopened', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const futureDate = addDays(new Date(), 3);
    await selectDate(futureDate);
    
    // Close and reopen calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton); // Close
    fireEvent.click(dateButton); // Reopen
    
    // Wait for and verify calendar is open
    const calendarDialog = await waitFor(() => getCalendarDialog());
    expect(calendarDialog).toBeInTheDocument();
    
    // Find all day cells
    const calendar = within(calendarDialog);
    const days = calendar.getAllByRole('gridcell');
    
    // Find the cell matching our selected date
    const selectedCell = days.find(
      cell => cell.textContent?.trim() === format(futureDate, 'd') &&
      !cell.className.includes('day-outside')
    );
    
    expect(selectedCell).toHaveAttribute('aria-selected', 'true');
  });

  it('closes calendar when clicking outside', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Wait for calendar to open
    await waitFor(() => {
      const calendarDialog = getCalendarDialog();
      expect(calendarDialog).toBeInTheDocument();
    });
    
    // Find and click the modal backdrop
    const backdrop = screen.getByTestId('reminder-date-picker').closest('[role="dialog"]');
    if (!backdrop) throw new Error('Modal backdrop not found');
    fireEvent.click(backdrop);
    
    // Verify calendar is closed
    await waitFor(() => {
      const calendarDialog = getCalendarDialog();
      expect(calendarDialog).toBeFalsy();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    const calendarDialog = await waitFor(() => getCalendarDialog());
    if (!calendarDialog) throw new Error('Calendar dialog not found');
    
    // Find today's cell and navigate from there
    const today = new Date();
    const calendar = within(calendarDialog);
    const days = calendar.getAllByRole('gridcell');
    const todayCell = days.find(
      cell => cell.textContent?.trim() === format(today, 'd') &&
      !cell.className.includes('day-outside')
    );
    
    if (!todayCell) throw new Error('Today cell not found');
    
    // Focus and navigate
    todayCell.focus();
    fireEvent.keyDown(todayCell, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    
    // Verify one day ahead is selected
    const tomorrow = addDays(today, 1);
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(tomorrow, 'PPP'));
    });
  });
});
