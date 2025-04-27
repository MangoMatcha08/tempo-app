
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function getCalendarDialog() {
  // Get all dialogs
  const dialogs = screen.getAllByRole('dialog');
  // Find the one that contains the calendar (has rdp class)
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
    expect(buttonText).toContain(format(date, 'PPP'));
  });
  
  return dateButton;
}

