
import { screen, fireEvent, waitFor } from '@testing-library/react';

export async function openSelect(labelText: string) {
  const trigger = screen.getByLabelText(labelText);
  fireEvent.click(trigger);
  
  // Wait for the select content to be mounted in the portal
  await waitFor(() => {
    expect(document.querySelector('[role="listbox"]')).toBeInTheDocument();
  });
  
  return trigger;
}

export async function selectOption(labelText: string, optionText: string) {
  await openSelect(labelText);
  
  const option = screen.getByText(optionText);
  fireEvent.click(option);
  
  // Wait for the select to close
  await waitFor(() => {
    expect(document.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });
}

export async function openDatePicker(testId: string) {
  const button = screen.getByTestId(testId);
  fireEvent.click(button);
  
  // Wait for the calendar to be mounted in the portal
  await waitFor(() => {
    expect(document.querySelector('.rdp')).toBeInTheDocument();
  });
  
  return button;
}
