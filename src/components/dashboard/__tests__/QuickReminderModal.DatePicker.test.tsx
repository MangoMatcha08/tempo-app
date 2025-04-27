
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { format, addDays, subDays } from 'date-fns';
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

  it('opens calendar on date picker click', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays current date by default', () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
  });

  it('allows selecting a future date', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const futureDate = addDays(new Date(), 5);
    const dateButton = screen.getByTestId('reminder-date-picker');
    
    // Open calendar
    fireEvent.click(dateButton);
    
    // Find and click the future date
    const futureDateCell = screen.getByRole('gridcell', { name: format(futureDate, 'd') });
    fireEvent.click(futureDateCell);
    
    // Verify the selected date is displayed
    await waitFor(() => {
      expect(dateButton).toHaveTextContent(format(futureDate, 'PPP'));
    });
  });

  it('persists selected date when calendar is reopened', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const futureDate = addDays(new Date(), 3);
    const dateButton = screen.getByTestId('reminder-date-picker');
    
    // Select a date
    fireEvent.click(dateButton);
    const futureDateCell = screen.getByRole('gridcell', { name: format(futureDate, 'd') });
    fireEvent.click(futureDateCell);
    
    // Close and reopen calendar
    await waitFor(() => {
      fireEvent.click(dateButton);
    });
    
    // Verify the previously selected date is still highlighted
    const selectedDate = screen.getByRole('gridcell', { name: format(futureDate, 'd') });
    expect(selectedDate).toHaveAttribute('aria-selected', 'true');
  });

  it('updates form state when date is selected', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Fill in required title field to enable form submission
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Reminder' } });
    
    // Select a future date
    const futureDate = addDays(new Date(), 2);
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    const futureDateCell = screen.getByRole('gridcell', { name: format(futureDate, 'd') });
    fireEvent.click(futureDateCell);
    
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

  it('closes calendar when clicking outside', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Verify calendar is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Click outside (the modal background)
    fireEvent.click(document.body);
    
    // Verify calendar is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    const dialog = await screen.findByRole('dialog');
    
    // Press arrow right to move to next day
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    
    // Press Enter to select the date
    fireEvent.keyDown(dialog, { key: 'Enter' });
    
    // Verify a date was selected
    await waitFor(() => {
      expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
    });
  });
});

