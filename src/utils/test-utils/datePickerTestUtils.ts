
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

async function getCalendarDialog() {
  const dialogs = screen.queryAllByRole('dialog');
  // Find the calendar dialog by checking for the rdp (react-day-picker) class
  const calendar = dialogs.find(dialog => dialog.querySelector('.rdp'));
  return calendar || null;
}

async function navigateToMonth(calendar: HTMLElement, targetDate: Date) {
  const currentMonthText = calendar.querySelector('[aria-live="polite"]')?.textContent || '';
  const targetMonthText = format(targetDate, 'MMMM yyyy');
  
  // Navigate until we reach the target month
  while (currentMonthText !== targetMonthText) {
    const isNext = new Date(currentMonthText) < targetDate;
    const button = within(calendar).getByRole('button', {
      name: isNext ? 'Go to next month' : 'Go to previous month'
    });
    fireEvent.click(button);
    await waitFor(() => {
      const newMonthText = calendar.querySelector('[aria-live="polite"]')?.textContent || '';
      if (newMonthText === currentMonthText) {
        throw new Error('Month navigation did not update');
      }
    });
  }
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
  await navigateToMonth(calendarDialog, date);
  
  // Format the date we're looking for
  const dayString = format(date, 'd');
  console.log('Looking for day:', dayString);
  
  // Get all day cells within calendar
  const calendar = within(calendarDialog);
  const dayCells = calendar.getAllByRole('gridcell');
  const targetCell = dayCells.find(cell => {
    const button = cell.querySelector('button');
    return button?.textContent === dayString && !button.classList.contains('day-outside');
  });
  
  if (!targetCell) {
    throw new Error(`Could not find cell for date ${dayString}`);
  }
  
  // Click the cell
  fireEvent.click(targetCell);
  
  // Wait for selection to be reflected in the button
  await waitFor(() => {
    const updatedButton = screen.getByTestId('reminder-date-picker');
    const buttonText = updatedButton.textContent || '';
    expect(buttonText).toContain(format(date, 'PPP'));
  });
  
  return dateButton;
}
