
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
  
  // Wait a bit for the calendar to be fully rendered
  await waitFor(() => {
    const dayCell = screen.getByRole('gridcell', { name: dayText });
    expect(dayCell).toBeInTheDocument();
  });
  
  const dayButton = screen.getByRole('gridcell', { name: dayText });
  
  console.log('Found day cell, clicking...');
  fireEvent.click(dayButton);
  
  // Wait for the button text to update with a more robust check
  const expectedDateText = format(date, 'PPP');
  console.log('Waiting for date to update to:', expectedDateText);
  
  await waitFor(() => {
    const updatedButton = screen.getByTestId('reminder-date-picker');
    const buttonText = updatedButton.textContent || '';
    // Remove any extra whitespace and check if the date text is included
    const normalizedText = buttonText.trim().replace(/\s+/g, ' ');
    expect(normalizedText).toContain(expectedDateText);
  }, {
    timeout: 2000, // Increase timeout for state updates
    interval: 100  // Check more frequently
  });
  
  return screen.getByTestId('reminder-date-picker');
}
