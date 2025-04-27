
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

export async function openDatePicker(testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await act(async () => {
    await userEvent.click(trigger);
  });
  
  // Wait for calendar dialog to be visible
  return waitFor(() => {
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    return dialog;
  });
}

export async function selectCalendarDate(date: Date) {
  const formattedDay = date.getDate().toString();
  
  // Find and click the day button
  const dayButton = screen.getByRole('button', { name: new RegExp(`^${formattedDay}$`) });
  await act(async () => {
    await userEvent.click(dayButton);
  });
  
  return waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}
