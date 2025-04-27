
import { screen, within, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Gets the calendar content from Radix Portal
 */
const getCalendarContent = async () => {
  return waitFor(() => {
    // Find Shadcn calendar in portal
    const content = document.querySelector('[role="dialog"] .rdp');
    if (!content) {
      throw new Error('Calendar content not found in portal');
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
  
  // Wait for Shadcn calendar to be visible in portal
  await waitFor(() => {
    const calendar = document.querySelector('[role="dialog"] .rdp');
    if (!calendar) {
      throw new Error('Shadcn calendar not found after clicking trigger');
    }
  });
  
  return trigger;
};

/**
 * Finds the date button in the calendar using Shadcn's button structure
 */
const findDateButton = async (date: Date) => {
  const formattedDate = format(date, 'PPP');
  
  // Wait for Shadcn date buttons to be rendered
  await waitFor(() => {
    const tableRows = document.querySelectorAll('.rdp-tbody .rdp-row');
    if (!tableRows.length) {
      throw new Error('No date rows found in Shadcn calendar');
    }
  });

  // Find the button by its full date in aria-label
  const button = Array.from(document.querySelectorAll('button.rdp-button'))
    .find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      if (!ariaLabel) return false;
      // Use includes because aria-label might have additional text
      return ariaLabel.includes(formattedDate);
    });
  
  if (!button) {
    console.error('Available buttons:', 
      Array.from(document.querySelectorAll('button.rdp-button'))
        .map(btn => ({
          ariaLabel: btn.getAttribute('aria-label'),
          text: btn.textContent
        }))
    );
    throw new Error(`Could not find button for date ${formattedDate}`);
  }
  
  return button;
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
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await openCalendar(testId);
      const dateButton = await findDateButton(date);
      
      // Click the date button
      await act(async () => {
        await userEvent.click(dateButton);
      });
      
      // Wait for selected date to be reflected in trigger button
      await waitFor(() => {
        const trigger = screen.getByTestId(testId);
        const buttonText = trigger.textContent || '';
        const formattedDate = format(date, 'PPP');
        // Remove any extra whitespace and check if the date text is included
        const normalizedText = buttonText.trim().replace(/\s+/g, ' ');
        expect(normalizedText).toContain(formattedDate);
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

