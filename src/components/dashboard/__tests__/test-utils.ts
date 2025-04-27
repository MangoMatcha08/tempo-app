
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function openDatePicker() {
  try {
    const dateButton = screen.getByTestId('reminder-date-picker');
    console.log('Found date picker button with text:', dateButton.textContent);
    fireEvent.click(dateButton);
    return dateButton;
  } catch (error) {
    console.error('Failed to find date picker by test id, falling back to role...');
    const dateButton = screen.getByRole('button', { name: /pick a date|calendar/i });
    console.log('Found date picker button by role with text:', dateButton.textContent);
    fireEvent.click(dateButton);
    return dateButton;
  }
}

export function getCalendarDialog() {
  return screen.getAllByRole('dialog').find(dialog => 
    dialog.querySelector('.rdp') !== null
  );
}

export async function selectDate(date: Date) {
  console.log('Starting date selection for:', format(date, 'PPP'));
  
  // Get the date picker button and click it
  const dateButton = await openDatePicker();
  
  // Find the day button in the calendar
  const dayText = format(date, 'd');
  console.log('Looking for day cell:', dayText);
  
  const dayButton = screen.getByRole('gridcell', { 
    name: dayText
  });
  
  console.log('Found day cell, clicking...');
  fireEvent.click(dayButton);
  
  // Wait for the button text to update
  const expectedDateText = format(date, 'PPP');
  console.log('Waiting for date to update to:', expectedDateText);
  
  await waitFor(() => {
    const button = screen.getByTestId('reminder-date-picker');
    expect(button).toHaveTextContent(expectedDateText);
  });
  
  return screen.getByTestId('reminder-date-picker');
}
