
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

export async function selectDate(date: Date) {
  // Open calendar
  const dateButton = screen.getByTestId('reminder-date-picker');
  fireEvent.click(dateButton);
  
  // Wait for calendar to open
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  
  // Select the date
  const dateCell = screen.getByRole('gridcell', { name: format(date, 'd') });
  fireEvent.click(dateCell);
  
  // Wait for selection to be reflected
  await waitFor(() => {
    expect(dateButton).toHaveTextContent(format(date, 'PPP'));
  });
  
  return dateButton;
}

