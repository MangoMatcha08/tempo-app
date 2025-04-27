
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
    }, { timeout: 5000 });
  } catch (error) {
    testLogger.error('Error opening date picker:', error);
    throw error;
  }
}

/**
 * Selects a date from the calendar
 * Note: ShadCN calendar uses buttons with role="gridcell" instead of actual buttons
 */
export async function selectCalendarDate(date: Date) {
  const formattedDay = date.getDate().toString();
  
  try {
    // Find the calendar container first
    const calendar = await waitFor(() => {
      const cal = screen.getByTestId('date-picker-calendar');
      expect(cal).toBeInTheDocument();
      return cal;
    }, { timeout: 5000 });

    // Log the calendar structure to help with debugging
    testLogger.dom.logCalendar(calendar);
    
    // Find the day cell using the day text content
    // In ShadCN calendar, days are buttons with role="gridcell"
    const dayCells = await waitFor(() => {
      const cells = calendar.querySelectorAll('[role="gridcell"]');
      if (cells.length === 0) {
        throw new Error('No gridcell elements found in calendar');
      }
      return Array.from(cells);
    }, { timeout: 5000 });
    
    // Find the day cell with matching text content
    const dayCell = dayCells.find(cell => cell.textContent?.trim() === formattedDay);
    if (!dayCell) {
      testLogger.error(`Could not find day cell with text "${formattedDay}"`);
      testLogger.dom.logStructure(calendar);
      throw new Error(`Could not find gridcell for date: ${formattedDay}`);
    }
    
    // Log the found cell for debugging
    testLogger.dom.logElement(dayCell);
    
    // Use fireEvent.click directly on the cell (which is a button element)
    await act(async () => {
      fireEvent.click(dayCell);
    });
    
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
 * Finds a specific day cell in the calendar
 */
export const findDayCell = async (dayText: string) => {
  const days = await getCalendarDays();
  return days.find(day => day.textContent?.trim() === dayText);
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
