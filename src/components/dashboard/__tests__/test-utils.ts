
import { screen, fireEvent } from '@testing-library/react';
import { format } from 'date-fns';

export function openDatePicker(date: Date) {
  const dateButton = screen.getByRole('button', { name: format(date, 'PPP') });
  fireEvent.click(dateButton);
  return dateButton;
}

export function getCalendarDialog() {
  return screen.getAllByRole('dialog').find(dialog => 
    dialog.querySelector('.rdp') !== null
  );
}
