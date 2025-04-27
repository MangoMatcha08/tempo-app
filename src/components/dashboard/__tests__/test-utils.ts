
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function openDatePicker() {
  // Find date picker button using aria-haspopup
  const dateButton = screen.getByRole('button', {
    name: (name) => /pick a date|april/i.test(name),
    'aria-haspopup': 'dialog'
  });
  
  console.log('Found date picker button with text:', dateButton.textContent);
  fireEvent.click(dateButton);
  return dateButton;
}

export function getCalendarDialog() {
  // Get the calendar dialog
  return screen.getAllByRole('dialog').find(dialog => 
    dialog.querySelector('.rdp') !== null
  );
}

export async function selectDate(date: Date) {
  console.log('Starting date selection for:', format(date, 'PPP'));
  
  // Open the date picker
  await openDatePicker();
  
  // Get the calendar dialog
  const calendarDialog = getCalendarDialog();
  if (!calendarDialog) {
    throw new Error('Calendar dialog not found after opening date picker');
  }
  
  // Find and click the day button
  const dayText = format(date, 'd');
  console.log('Looking for day cell:', dayText);
  
  const dayButton = screen.getByRole('gridcell', { 
    name: dayText
  });
  
  console.log('Found day cell, clicking...');
  fireEvent.click(dayButton);
  
  // Expected formatted date
  const expectedDateText = format(date, 'PPP');
  console.log('Waiting for date to update to:', expectedDateText);
  
  // Wait for the button text to update
  await waitFor(() => {
    const button = screen.getByRole('button', {
      'aria-haspopup': 'dialog',
    });
    expect(button).toHaveTextContent(expectedDateText);
    return button;
  });
  
  const finalButton = screen.getByRole('button', {
    'aria-haspopup': 'dialog',
  });
  
  console.log('Final button text:', finalButton.textContent);
  return finalButton;
}
