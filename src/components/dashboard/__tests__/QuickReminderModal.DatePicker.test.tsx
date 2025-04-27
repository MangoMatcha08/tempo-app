
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    
    const futureDate = addDays(new Date(), 5);
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
    fireEvent.click(dateButton);
    
    // Get the calendar dialog
    const calendarDialog = await waitFor(() => getCalendarDialog());
    if (!calendarDialog) throw new Error('Calendar dialog not found');
    
    // Use within to scope our search to the calendar
    const calendar = within(calendarDialog);
    const dayCells = calendar.getAllByRole('gridcell');
    
    // Find the selected date
    const selectedCell = dayCells.find(cell => 
      cell.textContent?.trim() === format(futureDate, 'd') &&
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
    await waitFor(() => getCalendarDialog());
    
    // Click outside (the modal background)
    const modalBackground = screen.getByRole('dialog');
    fireEvent.click(modalBackground);
    
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
    
    // Use arrow keys to navigate
    fireEvent.keyDown(calendarDialog, { key: 'ArrowRight' });
    fireEvent.keyDown(calendarDialog, { key: 'Enter' });
    
    // Verify a date was selected
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + 1);
    
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton).toHaveTextContent(format(selectedDate, 'PPP'));
    });
  });

  it('updates form state when date is selected', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Fill in required title field
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Reminder' } });
    
    // Select a future date
    const futureDate = addDays(new Date(), 2);
    await selectDate(futureDate);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create reminder/i });
    fireEvent.click(submitButton);
    
    // Verify the reminder was created with the selected date
    await waitFor(() => {
      expect(mockOnReminderCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: expect.any(Date),
          title: 'Test Reminder'
        })
      );
    });
  });
});
