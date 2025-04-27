
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
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
  // Format day to match calendar button format (remove leading zero)
  const formattedDay = date.getDate().toString();
  
  // Find and click the specific day button using role and name
  const dayButton = screen.getByRole('gridcell', {
    name: formattedDay,
  }).querySelector('button');
  
  if (!dayButton) {
    throw new Error(`Could not find button for date: ${formattedDay}`);
  }

  await act(async () => {
    await userEvent.click(dayButton);
  });
  
  // Wait for calendar to close
  return waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}

// Helper to verify selected date in the date picker
export async function verifySelectedDate(expectedDate: Date, testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await waitFor(() => {
    expect(trigger).toHaveTextContent(format(expectedDate, 'PPP'));
  });
}
