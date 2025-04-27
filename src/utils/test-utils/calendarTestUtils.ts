
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
 * Gets the calendar dialog from portal
 */
export const getCalendarDialog = async () => {
  return waitFor(() => {
    // Find the Radix popover content in the portal
    const popover = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!popover) {
      throw new Error('Calendar popover not found');
    }
    
    // Find the calendar table within the popover
    const calendar = within(popover).getByRole('table');
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
 * Closes calendar using Escape key
 */
export const closeCalendar = async () => {
  await act(async () => {
    await userEvent.keyboard('{Escape}');
  });

  await waitFor(() => {
    const calendar = screen.queryByRole('table');
    expect(calendar).not.toBeInTheDocument();
  });
};

/**
 * Finds the date button in the calendar
 */
const findDateButton = async (date: Date, calendar: HTMLElement) => {
  const formattedDay = format(date, 'd');
  const dayButtons = within(calendar).getAllByRole('button');
  
  const dayButton = dayButtons.find(button => 
    button.textContent?.includes(formattedDay)
  );
  
  if (!dayButton) {
    throw new Error(`Could not find button for date ${formattedDay}`);
  }
  
  return dayButton;
};

/**
 * Selects a date in the calendar
 */
export const selectDate = async (testId: string, date: Date, options: CalendarTestHelperOptions = {}) => {
  const { retries = defaultOptions.retries } = options;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const calendar = await openCalendar(testId);
      const dateButton = await findDateButton(date, calendar);
      
      await act(async () => {
        await userEvent.click(dateButton);
      });
      
      await closeCalendar();
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};
