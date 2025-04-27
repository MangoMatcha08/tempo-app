
import { screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

interface CalendarTestHelperOptions {
  timeout?: number;
  retries?: number;
  animationDelay?: number;
}

const defaultOptions: CalendarTestHelperOptions = {
  timeout: 1000,
  retries: 3,
  animationDelay: 300 // Default animation duration for Radix
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
  
  const dialog = await getCalendarDialog();
  
  // Wait for Radix animation to complete
  await waitFor(() => {
    expect(dialog).toHaveAttribute('data-state', 'open');
  });
  
  return dialog;
};

/**
 * Closes the calendar popover
 */
export const closeCalendar = async (options: CalendarTestHelperOptions = {}) => {
  const { timeout = defaultOptions.timeout, animationDelay = defaultOptions.animationDelay } = options;
  
  // Find the calendar dialog
  const dialog = await getCalendarDialog();
  
  // Click outside to close
  await act(async () => {
    // Using document.body ensures we click outside the popover
    await userEvent.click(document.body);
  });
  
  // Wait for animation duration
  await new Promise(resolve => setTimeout(resolve, animationDelay));
  
  // Verify calendar is closed
  await waitFor(() => {
    const calendar = screen.queryByTestId('date-picker-calendar');
    expect(calendar).not.toBeInTheDocument();
  }, { timeout });
};

/**
 * Locates a date button within the calendar
 */
const findDateButton = async (date: Date, dialog: HTMLElement) => {
  const formattedDay = format(date, 'd');
  const buttons = within(dialog).queryAllByRole('gridcell');
  
  console.log('Available calendar cells:', buttons.map(b => b.textContent));
  
  // Find the button that contains our target date
  const dayButton = buttons.find(button => 
    button.textContent?.trim() === formattedDay && 
    !button.getAttribute('disabled')
  );
  
  if (!dayButton) {
    throw new Error(`Could not find clickable button for date ${formattedDay}. Available dates: ${buttons.map(b => b.textContent)}`);
  }
  
  return dayButton;
};

/**
 * Selects a date in the calendar dialog
 */
export const selectDate = async (date: Date, options: CalendarTestHelperOptions = {}) => {
  const { timeout = defaultOptions.timeout, retries = defaultOptions.retries, animationDelay = defaultOptions.animationDelay } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Get dialog and date button
      const dialog = await getCalendarDialog();
      const dateButton = await findDateButton(date, dialog);
      
      // Click the date button
      await act(async () => {
        await userEvent.click(dateButton);
        // Wait for state updates
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      // Wait for any animations
      await new Promise(resolve => setTimeout(resolve, animationDelay));
      
      // Try to close the calendar
      await closeCalendar({ timeout, animationDelay });
      
      return true;
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed:`, error);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};

/**
 * Verifies that a date is selected
 */
export const verifySelectedDate = async (date: Date, testId: string) => {
  const button = screen.getByTestId(testId);
  const expectedDate = format(date, 'PPP');
  
  await waitFor(() => {
    expect(button).toHaveTextContent(expectedDate);
  });
};

