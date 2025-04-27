
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { act } from 'react';

/**
 * Gets the calendar content from Radix Portal
 */
const getCalendarContent = async () => {
  return waitFor(() => {
    const calendar = document.querySelector('[role="dialog"] .rdp');
    if (!calendar) {
      throw new Error('Calendar content not found in portal');
    }
    return calendar;
  }, { timeout: 2000 });
};

/**
 * Opens the calendar by clicking the trigger button
 */
export const openCalendar = async (testId: string) => {
  console.log('Opening calendar...');
  const trigger = screen.getByTestId(testId);
  
  await act(async () => {
    await userEvent.click(trigger);
  });
  
  await getCalendarContent();
  console.log('Calendar opened successfully');
  
  return trigger;
};

/**
 * Finds the date button in the calendar by matching the day number
 */
const findDateButton = async (date: Date) => {
  console.log('Finding date button for:', format(date, 'PPP'));
  
  let calendar: Element | null;
  
  // Wait for calendar to be fully rendered
  await waitFor(() => {
    calendar = document.querySelector('[role="dialog"] .rdp');
    if (!calendar) {
      throw new Error('Calendar content not found');
    }
  }, { timeout: 2000 });

  const dayText = format(date, 'd');
  const button = await waitFor(() => {
    const btn = screen.getByRole('button', { name: dayText });
    if (!btn || btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
      throw new Error('Date button not found or not interactable');
    }
    return btn;
  }, { timeout: 2000 });

  return button;
};

/**
 * Selects a date in the calendar
 */
export const selectDate = async (testId: string, date: Date, retries = 3) => {
  console.log('Selecting date:', format(date, 'PPP'));
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${retries}`);
      
      await openCalendar(testId);
      const dateButton = await findDateButton(date);
      
      console.log('Clicking date button...');
      
      await act(async () => {
        await userEvent.click(dateButton);
      });
      
      // Wait for selected date to be reflected in trigger button
      await waitFor(() => {
        const trigger = screen.getByTestId(testId);
        const formattedDate = format(date, 'PPP');
        
        if (!trigger.textContent?.includes(formattedDate)) {
          throw new Error('Date not updated in button text');
        }
      }, { timeout: 2000 });
      
      console.log('Date selected successfully');
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};
