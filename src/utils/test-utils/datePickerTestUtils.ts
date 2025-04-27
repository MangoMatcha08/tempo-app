
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';  // Import from React instead of react-dom/test-utils
import { format } from 'date-fns';

export async function openDatePicker(testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await act(async () => {
    await userEvent.click(trigger);
  });
  
  // Wait for calendar dialog to be visible
  return waitFor(() => {
    const dialog = screen.getByTestId('date-picker-calendar');
    expect(dialog).toBeInTheDocument();
    return dialog;
  });
}

export async function selectCalendarDate(date: Date) {
  // Format day to match calendar button format
  const formattedDay = date.getDate().toString();
  
  try {
    // Find the day cell first - in Shadcn Calendar, days are in gridcells
    const dayCell = await waitFor(() => {
      const cell = screen.getByRole('gridcell', { name: new RegExp(`^${formattedDay}$`) });
      if (!cell) throw new Error(`Could not find gridcell for date: ${formattedDay}`);
      return cell;
    });

    // Get the button inside the gridcell
    const dayButton = dayCell.querySelector('button');
    if (!dayButton) {
      throw new Error(`Could not find button inside gridcell for date: ${formattedDay}`);
    }

    // Click the button
    await act(async () => {
      await userEvent.click(dayButton);
    });
    
    // Wait for calendar to close
    await waitFor(() => {
      expect(screen.queryByTestId('date-picker-calendar')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    return true;
  } catch (error) {
    console.error('Error selecting date:', error);
    throw error;
  }
}

// Helper to verify selected date in the date picker
export async function verifySelectedDate(expectedDate: Date, testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await waitFor(() => {
    expect(trigger).toHaveTextContent(format(expectedDate, 'PPP'));
  }, { timeout: 5000 });
}

// Export a function for QuickReminderModal test that was missing
export const getCalendarPopover = async () => {
  return waitFor(() => {
    const popover = screen.getByTestId('date-picker-calendar');
    expect(popover).toBeInTheDocument();
    return popover;
  }, { timeout: 5000 });
};
