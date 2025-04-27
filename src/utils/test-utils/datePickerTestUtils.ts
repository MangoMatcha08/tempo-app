
import { screen, waitFor, within, fireEvent, act } from '@testing-library/react';
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
 * Find a day cell by its text content 
 */
export async function findDayCell(dayText: string) {
  try {
    // Find all gridcells in the calendar
    const calendar = await getCalendarPopover();
    const cells = within(calendar).queryAllByRole('gridcell');
    
    // Log for debugging
    testLogger.debug(`Finding day cell "${dayText}" among ${cells.length} cells`);
    
    // Find the cell with matching text content
    const dayCell = cells.find(cell => {
      const trimmedContent = cell.textContent?.trim();
      return trimmedContent === dayText;
    });
    
    if (!dayCell) {
      throw new Error(`Could not find gridcell for date: ${dayText}`);
    }
    
    return dayCell;
  } catch (error) {
    testLogger.error('Error finding day cell:', error);
    throw error;
  }
}

/**
 * Selects a date from the calendar
 */
export async function selectCalendarDate(date: Date) {
  const formattedDay = date.getDate().toString();
  
  try {
    // First ensure calendar is open
    await act(async () => {
      const calendar = await getCalendarPopover();
      
      // Find the specific day button within the gridcell
      const cells = within(calendar).queryAllByRole('gridcell');
      testLogger.debug(`Found ${cells.length} gridcells in calendar`);
      
      // Find the cell with the day we want
      const foundCell = cells.find(cell => cell.textContent?.trim() === formattedDay);
      
      if (!foundCell) {
        // Try to log all day cells for debugging
        testLogger.debug('Available day cells:');
        cells.forEach(cell => {
          testLogger.debug(`Cell content: "${cell.textContent?.trim()}"`);
        });
        throw new Error(`Could not find gridcell for date: ${formattedDay}`);
      }
      
      // Click the cell directly (in Shadcn, the gridcell is clickable)
      testLogger.debug(`Clicking on day cell: ${formattedDay}`);
      await userEvent.click(foundCell);
    });
    
    // Wait for a short time for React state to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    testLogger.error('Error selecting date:', error);
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
 * Helper function to get all calendar days
 */
export const getCalendarDays = async () => {
  const calendar = await getCalendarPopover();
  const days = calendar.querySelectorAll('[role="gridcell"]');
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
