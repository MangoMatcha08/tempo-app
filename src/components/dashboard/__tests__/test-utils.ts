
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function openDatePicker() {
  // Find the date picker button by aria-haspopup dialog attribute
  const dateButton = screen.getByRole('button', { 
    'aria-haspopup': 'dialog',
    name: /april 26th, 2025|pick a date/i 
  });
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
  
  // Wait for the button text to update with the selected date
  await waitFor(() => {
    expect(screen.getByRole('button', { 
      'aria-haspopup': 'dialog',
      name: format(date, 'PPP')
    })).toBeInTheDocument();
  });
  
  return screen.getByRole('button', { 
    'aria-haspopup': 'dialog',
    name: format(date, 'PPP')
  });
}
