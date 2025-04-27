
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
 * Gets the calendar from within a portal/popover
 */
export const getCalendarDialog = async () => {
  return waitFor(() => {
    // First try to find the calendar in a popover
    const popover = document.querySelector('[role="dialog"]');
    if (!popover) {
      throw new Error('Calendar popover not found');
    }
    
    // Find the calendar element within the popover
    const calendar = within(popover).getByRole('grid');
    expect(calendar).toBeInTheDocument();
    return calendar;
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
    const calendar = screen.queryByRole('grid');
    expect(calendar).not.toBeInTheDocument();
  });
};

/**
 * Locates a date button within the calendar
 */
const findDateButton = async (date: Date, calendar: HTMLElement) => {
  const formattedDay = format(date, 'd');
  const dayButtons = within(calendar).getAllByRole('gridcell');
  
  // Find the button that matches our target date
  const dayButton = dayButtons.find(button => 
    button.textContent?.trim() === formattedDay
  );
  
  if (!dayButton) {
    throw new Error(`Could not find button for date ${formattedDay}`);
  }
  
  return dayButton;
};

/**
 * Selects a date in the calendar
 */
export const selectDate = async (date: Date, options: CalendarTestHelperOptions = {}) => {
  const { timeout = defaultOptions.timeout, retries = defaultOptions.retries } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Open calendar and get dialog
      const calendar = await openCalendar('reminder-date-picker');
      
      // Find and click date button
      const dateButton = await findDateButton(date, calendar);
      await act(async () => {
        dateButton.click();
      });
      
      // Close calendar
      await closeCalendar();
      
      return true;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};
