
import { screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Gets the calendar content from Radix Portal
 */
const getCalendarContent = async () => {
  return waitFor(() => {
    console.log('Looking for calendar content...');
    // Find calendar in portal with role="dialog"
    const calendar = document.querySelector('[role="dialog"] .rdp');
    if (!calendar) {
      throw new Error('Calendar content not found in portal');
    }
    console.log('Found calendar content');
    return calendar;
  }, { timeout: 2000 }); // Increased timeout for slower environments
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
  
  // Wait for calendar to be visible and interactive
  const content = await getCalendarContent();
  console.log('Calendar opened successfully');
  
  return trigger;
};

/**
 * Finds the date button in the calendar
 */
const findDateButton = async (date: Date) => {
  console.log('Finding date button for:', format(date, 'PPP'));
  
  // Wait for the table to be rendered
  await waitFor(() => {
    const table = document.querySelector('[role="dialog"] .rdp table');
    if (!table) {
      console.log('Available calendar content:', document.querySelector('[role="dialog"]')?.innerHTML);
      throw new Error('Calendar table not found');
    }
  }, { timeout: 2000 });

  // Look for the date cell and button
  const formattedDate = format(date, 'PPP');
  const buttons = Array.from(document.querySelectorAll('[role="dialog"] .rdp table button'));
  
  console.log('Found buttons:', buttons.length);
  buttons.forEach(btn => {
    console.log('Button:', {
      text: btn.textContent,
      ariaLabel: btn.getAttribute('aria-label'),
      className: btn.className
    });
  });

  const dateButton = buttons.find(btn => {
    const ariaLabel = btn.getAttribute('aria-label');
    return ariaLabel?.includes(formattedDate);
  });

  if (!dateButton) {
    throw new Error(`Could not find button for date ${formattedDate}`);
  }

  console.log('Found date button:', dateButton.getAttribute('aria-label'));
  return dateButton;
};

/**
 * Closes calendar using Escape key
 */
export const closeCalendar = async () => {
  await act(async () => {
    await userEvent.keyboard('{Escape}');
  });

  await waitFor(() => {
    const calendar = document.querySelector('[role="dialog"] .rdp');
    expect(calendar).not.toBeInTheDocument();
  });
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
        const buttonText = trigger.textContent || '';
        const formattedDate = format(date, 'PPP');
        const normalizedText = buttonText.trim().replace(/\s+/g, ' ');
        
        console.log('Checking button text:', {
          buttonText: normalizedText,
          expectedDate: formattedDate
        });
        
        expect(normalizedText).toContain(formattedDate);
      }, { timeout: 2000 });
      
      console.log('Date selected successfully');
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Added delay between retries
      }
    }
  }
  
  throw new Error(`Failed to select date after ${retries} attempts. Last error: ${lastError?.message}`);
};

