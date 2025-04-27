
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { format, addMonths, subMonths } from 'date-fns';

async function navigateToMonth(targetDate: Date) {
  const calendarDialog = await waitFor(() => getCalendarDialog());
  if (!calendarDialog) throw new Error('Calendar dialog not found');
  
  const calendar = within(calendarDialog);
  const currentMonthText = calendar.getByRole('presentation').textContent || '';
  const targetMonthText = format(targetDate, 'MMMM yyyy');
  
  // Navigate until we reach the target month
  while (currentMonthText !== targetMonthText) {
    const isNext = new Date(currentMonthText) < targetDate;
    const button = calendar.getByRole('button', {
      name: isNext ? 'Go to next month' : 'Go to previous month'
    });
    fireEvent.click(button);
    await waitFor(() => {
      const newMonthText = calendar.getByRole('presentation').textContent || '';
      if (newMonthText === currentMonthText) {
        throw new Error('Month navigation did not update');
      }
    });
  }
}

export async function getCalendarDialog() {
  const dialogs = screen.queryAllByRole('dialog');
  // Find the calendar dialog by checking for the calendar-specific content
  return dialogs.find(dialog => dialog.querySelector('.rdp')) || null;
}

export async function selectDate(date: Date) {
  console.log('Starting date selection for:', format(date, 'PPP'));
  
  // Open calendar
  const dateButton = screen.getByTestId('reminder-date-picker');
  fireEvent.click(dateButton);
  
  // Wait for calendar dialog to open and be interactive
  const calendarDialog = await waitFor(() => getCalendarDialog());
  if (!calendarDialog) {
    throw new Error('Calendar dialog not found');
  }
  
  // Navigate to correct month first
  await navigateToMonth(date);
  
  // Use within to scope our queries to the calendar dialog
  const calendar = within(calendarDialog);
  
  // Format the date we're looking for
  const dayString = format(date, 'd');
  console.log('Looking for day:', dayString);
  
  // Get all day cells and find the one that matches our date
  const dayCells = calendar.getAllByRole('gridcell');
  const targetCell = dayCells.find(cell => {
    const cellText = cell.textContent?.trim();
    return cellText === dayString && !cell.className.includes('day-outside');
  });
  
  if (!targetCell) {
    throw new Error(`Could not find cell for date ${dayString}`);
  }
  
  // Click the cell
  console.log('Clicking date cell:', targetCell.textContent);
  fireEvent.click(targetCell);
  
  // Wait for selection to be reflected in the button
  await waitFor(() => {
    const updatedButton = screen.getByTestId('reminder-date-picker');
    const buttonText = updatedButton.textContent || '';
    const expectedText = format(date, 'PPP');
    if (!buttonText.includes(expectedText)) {
      throw new Error(`Expected button to contain "${expectedText}", got "${buttonText}"`);
    }
  }, { timeout: 2000 });
  
  return dateButton;
}
