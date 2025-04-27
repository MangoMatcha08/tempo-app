
import { screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Gets the calendar content from Radix Portal
 */
const getCalendarContent = async () => {
  return waitFor(() => {
    // Find PopoverContent in portal
    const content = document.querySelector('[role="dialog"].rdp');
    if (!content) {
      throw new Error('Calendar content not found');
    }
    return content;
  }, { timeout: 1000 });
};

/**
 * Opens the calendar by clicking the trigger button
 */
export const openCalendar = async (testId: string) => {
  const trigger = screen.getByTestId(testId);
  await act(async () => {
    await userEvent.click(trigger);
  });
  
  // Wait for calendar to be visible
  await waitFor(() => {
    const calendar = document.querySelector('.rdp');
    if (!calendar) {
      throw new Error('Calendar not found after clicking trigger');
    }
  });
  
  return trigger;
};

/**
 * Finds the date button in the calendar
 */
const findDateButton = async (date: Date) => {
  const formattedDay = format(date, 'd');
  
  await waitFor(() => {
    const buttons = document.querySelectorAll('.rdp-button');
    if (!buttons.length) {
      throw new Error('No date buttons found in calendar');
    }
  });

  const dayButtons = Array.from(document.querySelectorAll('.rdp-button'));
  const dayButton = dayButtons.find(button => 
    button.textContent?.includes(formattedDay)
  );
  
  if (!dayButton) {
    throw new Error(`Could not find button for date ${formattedDay}`);
  }
  
  return dayButton;
};

/**
 * Closes calendar using Escape key
 */
export const closeCalendar = async () => {
  await act(async () => {
    await userEvent.keyboard('{Escape}');
  });

  await waitFor(() => {
    const calendar = document.querySelector('.rdp');
    expect(calendar).not.toBeInTheDocument();
  });
};

/**
 * Selects a date in the calendar
 */
export const selectDate = async (testId: string, date: Date, retries = 3) => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await openCalendar(testId);
      const dateButton = await findDateButton(date);
      
      await act(async () => {
        await userEvent.click(dateButton);
      });
      
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};
