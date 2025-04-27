
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function openDatePicker() {
  // Find date picker button by looking for calendar icon and correct ARIA role
  const dateButton = screen.getByRole('button', {
    name: (name) => /pick a date|april 26th, 2025/i.test(name),
    description: /calendar/i
  });
  
  console.log('Opening date picker with button:', dateButton.textContent);
  fireEvent.click(dateButton);
  return dateButton;
}

export function getCalendarDialog() {
  // Get the calendar dialog and verify it's visible
  return screen.getAllByRole('dialog').find(dialog => 
    dialog.querySelector('.rdp') !== null
  );
}

export async function selectDate(date: Date) {
  // Open the date picker
  await openDatePicker();
  
  // Get the calendar dialog and verify it's visible
  const calendarDialog = getCalendarDialog();
  if (!calendarDialog) {
    throw new Error('Calendar dialog not found');
  }
  
  console.log('Selecting date:', format(date, 'd'));
  
  // Find and click the day button
  const dayButton = screen.getByRole('gridcell', { 
    name: format(date, 'd')
  });
  fireEvent.click(dayButton);
  
  const expectedDateText = format(date, 'PPP');
  console.log('Waiting for date to update to:', expectedDateText);
  
  // Wait for the button text to update with the selected date
  await waitFor(() => {
    const button = screen.getByRole('button', { 
      name: (name) => name.includes(expectedDateText)
    });
    expect(button).toBeInTheDocument();
  });
  
  return screen.getByRole('button', { 
    name: (name) => name.includes(expectedDateText)
  });
}
