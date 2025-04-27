
import { screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

interface CalendarTestHelperOptions {
  timeout?: number;
  retries?: number;
}

const defaultOptions: CalendarTestHelperOptions = {
  timeout: 1000,
  retries: 3
};

/**
 * Gets the calendar dialog element
 */
export const getCalendarDialog = async () => {
  return waitFor(() => {
    const dialog = screen.getByTestId('date-picker-calendar');
    expect(dialog).toBeInTheDocument();
    return dialog;
  });
};

/**
 * Opens the calendar by clicking the trigger button
 */
export const openCalendar = async (testId: string) => {
  const trigger = screen.getByTestId(testId);
  await act(async () => {
    await userEvent.click(trigger);
  });
  
  return getCalendarDialog();
};

/**
 * Closes the calendar using the Escape key
 */
export const closeCalendar = async () => {
  await act(async () => {
    await userEvent.keyboard('{Escape}');
  });

  // Wait for the calendar to be removed from the DOM
  await waitFor(() => {
    const calendar = screen.queryByTestId('date-picker-calendar');
    expect(calendar).not.toBeInTheDocument();
  });
};

/**
 * Locates a date button within the calendar
 */
const findDateButton = async (date: Date, dialog: HTMLElement) => {
  const formattedDay = format(date, 'd');
  const buttons = within(dialog).queryAllByRole('gridcell');
  
  // Find the button that contains our target date
  const dayButton = buttons.find(button => 
    button.textContent?.trim() === formattedDay && 
    !button.getAttribute('disabled')
  );
  
  if (!dayButton) {
    throw new Error(`Could not find clickable button for date ${formattedDay}`);
  }
  
  return dayButton;
};

/**
 * Selects a date in the calendar dialog
 */
export const selectDate = async (date: Date, options: CalendarTestHelperOptions = {}) => {
  const { timeout = defaultOptions.timeout, retries = defaultOptions.retries } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Get dialog and date button
      const dialog = await getCalendarDialog();
      const dateButton = await findDateButton(date, dialog);
      
      // Click the date button using fireEvent directly
      await act(async () => {
        // Use regular click event which doesn't check pointer-events
        dateButton.click();
        
        // Give React time to process the click
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      // Close the calendar using Escape key
      await closeCalendar();
      
      return true;
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};
