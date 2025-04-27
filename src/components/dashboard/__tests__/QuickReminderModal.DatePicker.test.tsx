
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { selectDate, getCalendarDialog, getDayButtonByText, getSelectedDay } from '../../../utils/test-utils/datePickerTestUtils';

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
    
    // Wait for popover content with calendar to be visible
    const calendar = await waitFor(() => screen.getByTestId('date-picker-calendar'));
    expect(calendar).toBeInTheDocument();
    expect(calendar.querySelector('.rdp')).toBeInTheDocument();
  });

  it('allows selecting a future date', async () => {
    // This test needs extra time due to month navigation
    vi.setConfig({ testTimeout: 10000 });
    
    render(<QuickReminderModal {...defaultProps} />);
    
    // Select a date 5 days in the future (should be within current month)
    const futureDate = addDays(new Date(), 5);
    await selectDate(futureDate);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(futureDate, 'PPP'));
  });

  it('persists selected date when calendar is reopened', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Select date 3 days in the future
    const futureDate = addDays(new Date(), 3);
    await selectDate(futureDate);
    
    // Verify the selected date is shown
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(futureDate, 'PPP'));
    
    // Close and reopen calendar
    fireEvent.click(dateButton);
    
    // Wait for calendar to reopen and verify selected date is highlighted
    const calendar = await waitFor(() => screen.getByTestId('date-picker-calendar'));
    expect(calendar).toBeInTheDocument();
    
    // Find selected day button
    const selectedDay = within(calendar).getByRole('button', { 
      selected: true 
    });
    
    expect(selectedDay).toBeInTheDocument();
    expect(selectedDay).toHaveTextContent(format(futureDate, 'd'));
  });

  it('closes calendar when clicking outside', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Verify calendar is opened
    const calendar = await waitFor(() => screen.getByTestId('date-picker-calendar'));
    expect(calendar).toBeInTheDocument();
    
    // Click outside (the modal dialog background)
    const modalDialog = screen.getByRole('dialog');
    fireEvent.mouseDown(modalDialog);
    fireEvent.mouseUp(modalDialog);
    
    // Verify calendar is closed
    await waitFor(() => {
      expect(screen.queryByTestId('date-picker-calendar')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Open calendar
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    // Wait for calendar to open
    const calendar = await waitFor(() => screen.getByTestId('date-picker-calendar'));
    expect(calendar).toBeInTheDocument();
    
    // Find today's button
    const today = new Date();
    const todayString = format(today, 'd');
    
    // Get today's button
    const todayButton = getDayButtonByText(calendar, todayString);
    expect(todayButton).toBeInTheDocument();
    
    // Focus today's button
    todayButton?.focus();
    
    // Press right arrow to move to tomorrow
    fireEvent.keyDown(document.activeElement || todayButton!, { key: 'ArrowRight' });
    
    // Click on the focused element
    fireEvent.click(document.activeElement || todayButton!);
    
    // Verify tomorrow's date is selected
    const tomorrow = addDays(today, 1);
    await waitFor(() => {
      const updatedButton = screen.getByTestId('reminder-date-picker');
      expect(updatedButton.textContent).toContain(format(tomorrow, 'PPP'));
    }, { timeout: 2000 });
  });
});
