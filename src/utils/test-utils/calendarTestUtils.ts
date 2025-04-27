
import { screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Gets the calendar content from Radix Portal
 */
const getCalendarContent = async () => {
  return waitFor(() => {
    // Find calendar in portal
    const content = document.querySelector('[role="dialog"] .react-calendar');
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
  
  // Wait for calendar to be visible in portal
  await waitFor(() => {
    const calendar = document.querySelector('.react-calendar');
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
  
  // Wait for date buttons to be rendered
  await waitFor(() => {
    const buttons = document.querySelectorAll('button[role="gridcell"]');
    if (!buttons.length) {
      throw new Error('No date buttons found in calendar');
    }
  });

  const dayButtons = Array.from(document.querySelectorAll('button[role="gridcell"]'));
  const dayButton = dayButtons.find(button => 
    button.getAttribute('aria-label')?.includes(format(date, 'PPP'))
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
    const calendar = document.querySelector('.react-calendar');
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
      
      // Wait for selected date to be reflected in trigger button
      await waitFor(() => {
        const trigger = screen.getByTestId(testId);
        expect(trigger).toHaveTextContent(format(date, 'PPP'));
      }, { timeout: 2000 });
      
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
