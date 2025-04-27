
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { format } from 'date-fns';
import { testLogger } from './testDebugUtils';

/**
 * Opens the date picker dialog
 */
export async function openDatePicker(testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await act(async () => {
    await userEvent.click(trigger);
  });
  
  return waitFor(() => {
    const dialog = screen.getByTestId('date-picker-calendar');
    expect(dialog).toBeInTheDocument();
    return dialog;
  });
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
    
    // Find the day cell using attribute and content matching
    // Note: In ShadCN calendar, the days are buttons with role="gridcell"
    const dayCells = await waitFor(() => {
      const cells = calendar.querySelectorAll('[role="gridcell"]');
      if (cells.length === 0) {
        throw new Error('No gridcell elements found in calendar');
      }
      return Array.from(cells);
    }, { timeout: 5000 });
    
    // Find the cell with matching day text
    const dayCell = dayCells.find(cell => cell.textContent?.trim() === formattedDay);
    
    if (!dayCell) {
      testLogger.error(`Could not find day cell with text "${formattedDay}"`);
      testLogger.dom.logStructure(calendar);
      throw new Error(`Could not find gridcell for date: ${formattedDay}`);
    }
    
    // Log the found cell for debugging
    testLogger.dom.logElement(dayCell);
    
    // Since the cell itself is a button in ShadCN, we click directly on it
    await act(async () => {
      // Use native click event since the cell is already a button
      fireEvent.click(dayCell);
    });
    
    // Wait for calendar to close
    await waitFor(() => {
      expect(screen.queryByTestId('date-picker-calendar')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    return true;
  } catch (error) {
    console.error('Error selecting date:', error);
    throw error;
  }
}

/**
 * Verifies that the selected date is displayed in the date picker trigger
 */
export async function verifySelectedDate(expectedDate: Date, testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await waitFor(() => {
    expect(trigger).toHaveTextContent(format(expectedDate, 'PPP'));
  }, { timeout: 5000 });
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
