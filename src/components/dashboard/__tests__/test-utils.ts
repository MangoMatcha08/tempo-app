
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function openDatePicker() {
  // Get the date button by its initial "Pick a date" text
  const dateButton = screen.getByRole('button', { name: /pick a date/i });
  fireEvent.click(dateButton);
  return dateButton;
}

export function getCalendarDialog() {
  return screen.getAllByRole('dialog').find(dialog => 
    dialog.querySelector('.rdp') !== null
  );
}

export async function selectDate(date: Date) {
  // Open the date picker
  const dateButton = await openDatePicker();
  
  // Get the calendar dialog and verify it's visible
  const calendarDialog = getCalendarDialog();
  if (!calendarDialog) {
    throw new Error('Calendar dialog not found');
  }
  
  // Find and click the day button
  const dayButton = screen.getByRole('gridcell', { name: format(date, 'd') });
  fireEvent.click(dayButton);
  
  // Wait for the button text to update
  await waitFor(() => {
    const updatedButton = screen.getByRole('button', { name: format(date, 'PPP') });
    expect(updatedButton).toBeInTheDocument();
  });
  
  return screen.getByRole('button', { name: format(date, 'PPP') });
}
