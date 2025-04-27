
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Gets the calendar content from Radix Portal
 */
const getCalendarContent = async () => {
  return waitFor(() => {
    console.log('Looking for calendar content...');
    const calendar = document.querySelector('[role="dialog"] .rdp');
    if (!calendar) {
      throw new Error('Calendar content not found in portal');
    }
    console.log('Found calendar content');
    return calendar;
  }, { timeout: 2000 });
};

/**
 * Opens the calendar by clicking the trigger button
 */
export const openCalendar = async (testId: string) => {
  console.log('Opening calendar...');
  const trigger = screen.getByTestId(testId);
  
  // Focus the trigger first
  await act(async () => {
    trigger.focus();
    await userEvent.click(trigger);
  });
  
  // Wait for calendar to be visible and interactive
  await getCalendarContent();
  console.log('Calendar opened successfully');
  
  return trigger;
};

/**
 * Finds the date button in the calendar by matching the day number
 */
const findDateButton = async (date: Date) => {
  console.log('Finding date button for:', format(date, 'PPP'));
  
  // Wait for calendar to be fully rendered with retry
  let calendar;
  await waitFor(() => {
    calendar = document.querySelector('[role="dialog"] .rdp');
    if (!calendar) {
      throw new Error('Calendar content not found');
    }
  }, { timeout: 2000 });

  // Get all calendar day buttons
  const buttons = Array.from(document.querySelectorAll('[role="dialog"] .rdp button'));
  
  console.log('Found buttons:', buttons.length);
  buttons.forEach(btn => {
    console.log('Button:', {
      text: btn.textContent,
      className: btn.className
    });
  });

  // Get just the day number we're looking for
  const targetDay = format(date, 'd'); // 'd' gives us just the day number
  console.log('Looking for day number:', targetDay);

  // Find button with matching day number and ensure it's interactable
  const dateButton = await waitFor(() => {
    const btn = buttons.find(btn => {
      const btnText = btn.textContent?.trim();
      const isMatch = btnText === targetDay;
      console.log(`Comparing button text "${btnText}" with target "${targetDay}":`, isMatch);
      return isMatch;
    });

    if (!btn || btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
      throw new Error('Date button not found or not interactable');
    }

    return btn;
  }, { timeout: 2000 });

  console.log('Found date button:', dateButton.textContent);
  return dateButton;
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
      
      // Simulate full click interaction
      await act(async () => {
        dateButton.focus();
        await userEvent.pointer([
          { keys: '[MouseLeft>]', target: dateButton },
          { keys: '[/MouseLeft]', target: dateButton }
        ]);
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
        
        if (!normalizedText.includes(formattedDate)) {
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
