
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testLogger } from './testDebugUtils';

/**
 * Opens the date picker dialog
 */
export async function openDatePicker(testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  try {
    await act(async () => {
      await userEvent.click(trigger);
    });
    
    return waitFor(() => {
      const dialog = screen.getByTestId('date-picker-calendar');
      expect(dialog).toBeInTheDocument();
      return dialog;
    }, { timeout: 2000 });
  } catch (error) {
    testLogger.error('Error opening date picker:', error);
    throw error;
  }
}

/**
 * Gets the calendar popover element
 */
export const getCalendarPopover = async () => {
  return waitFor(() => {
    const popover = screen.getByTestId('date-picker-calendar');
    expect(popover).toBeInTheDocument();
    return popover;
  }, { timeout: 5000 });
};

/**
 * Selects a date from the calendar
 */
export async function selectCalendarDate(date: Date) {
  try {
    // First ensure calendar is open
    const calendar = await getCalendarPopover();
    
    // Extract just the day number as a string (1-31)
    const dayNumber = date.getDate().toString();
    testLogger.debug(`Selecting day number: ${dayNumber}`);
    
    // Find all day buttons within the calendar
    const buttons = within(calendar).getAllByRole('gridcell');
    testLogger.debug(`Found ${buttons.length} day cells`);
    
    // Look for the button with matching day text
    const targetButton = Array.from(buttons).find(cell => {
      // Ensure we're finding an exact match for the day text
      return cell.textContent?.trim() === dayNumber;
    });

    if (!targetButton) {
      testLogger.error(`Could not find day cell with text "${dayNumber}"`);
      throw new Error(`Day cell with text "${dayNumber}" not found`);
    }

    testLogger.debug(`Found target day: ${dayNumber}, clicking now`);
    
    // Click the day button
    await act(async () => {
      await userEvent.click(targetButton);
    });
    
    testLogger.debug(`Click completed on day: ${dayNumber}`);
    return true;
  } catch (error) {
    testLogger.error('Error selecting calendar date:', error);
    throw error;
  }
}

/**
 * Helper function to get all calendar days
 */
export const getCalendarDays = async () => {
  const calendar = await getCalendarPopover();
  const days = within(calendar).getAllByRole('gridcell');
  return Array.from(days);
};

/**
 * Retries an operation with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>, 
  maxRetries: number = 3, 
  delayMs: number = 100
): Promise<T> => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      testLogger.error(`Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};
