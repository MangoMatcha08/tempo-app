
import { screen, waitFor, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testLogger } from './testDebugUtils';

/**
 * Opens a date picker by clicking its trigger element
 * Wrapped in act() to handle React state updates
 */
export async function openDatePicker(testId = 'reminder-date-picker'): Promise<HTMLElement> {
  try {
    const trigger = screen.getByTestId(testId);
    
    // Use act to wrap the user event
    await act(async () => {
      await userEvent.click(trigger);
    });
    
    // Wait for the calendar popover to appear
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
 * Finds a day cell by its text content
 * Handles button elements with gridcell role
 */
export async function findDayCell(dayText: string): Promise<HTMLElement> {
  try {
    const calendar = await getCalendarPopover();
    
    // First try to find by role and name
    try {
      const dayCell = within(calendar).getByRole('gridcell', { name: dayText });
      return dayCell;
    } catch (error) {
      testLogger.debug(`Could not find gridcell with name ${dayText}, trying alternative methods`);
    }
    
    // Then try by button with matching text
    try {
      const button = within(calendar).getByRole('button', { name: dayText });
      return button;
    } catch (error) {
      testLogger.debug(`Could not find button with name ${dayText}, falling back to text content`);
    }
    
    // Last resort - query all cells and check text content
    const cells = within(calendar).queryAllByRole('gridcell');
    
    testLogger.debug(`Finding day cell "${dayText}" among ${cells.length} cells`);
    
    const dayCell = cells.find(cell => {
      if (cell instanceof HTMLElement) {
        const trimmedContent = cell.textContent?.trim();
        return trimmedContent === dayText;
      }
      return false;
    });
    
    if (!dayCell || !(dayCell instanceof HTMLElement)) {
      throw new Error(`Could not find gridcell for date: ${dayText}`);
    }
    
    return dayCell;
  } catch (error) {
    testLogger.error('Error finding day cell:', error);
    throw error;
  }
}

/**
 * Selects a date in the calendar
 * Properly wrapped in act() to handle React state updates
 */
export async function selectCalendarDate(date: Date): Promise<boolean> {
  const formattedDay = date.getDate().toString();
  
  try {
    const calendar = await getCalendarPopover();
    testLogger.debug('Calendar found, looking for day:', formattedDay);
    
    let foundCell: HTMLElement | null = null;
    
    // First try to find by exact role + name
    try {
      foundCell = within(calendar).getByRole('gridcell', { name: formattedDay });
      testLogger.debug('Found cell by role + name');
    } catch (error) {
      // Fall back to text content matching
      const cells = within(calendar).queryAllByRole('gridcell');
      testLogger.debug(`Found ${cells.length} gridcells in calendar`);
      
      for (const cell of cells) {
        if (cell instanceof HTMLElement && cell.textContent?.trim() === formattedDay) {
          foundCell = cell;
          testLogger.debug('Found cell by text content');
          break;
        }
      }
    }
    
    if (!foundCell) {
      testLogger.debug('Available day cells:');
      const cells = within(calendar).queryAllByRole('gridcell');
      cells.forEach(cell => {
        if (cell instanceof HTMLElement) {
          testLogger.debug(`Cell content: "${cell.textContent?.trim()}"`);
        }
      });
      throw new Error(`Could not find gridcell for date: ${formattedDay}`);
    }
    
    // Perform click inside act to handle React state updates
    await act(async () => {
      // First try userEvent for more complete event simulation
      try {
        await userEvent.click(foundCell!);
      } catch (error) {
        // Fall back to fireEvent if userEvent fails
        testLogger.debug('UserEvent click failed, trying fireEvent');
        fireEvent.click(foundCell!);
      }
      
      // Small delay for state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 100));
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
export const getCalendarPopover = async (): Promise<HTMLElement> => {
  return waitFor(() => {
    const popover = screen.getByTestId('date-picker-calendar');
    expect(popover).toBeInTheDocument();
    return popover;
  }, { timeout: 5000 });
};

/**
 * Gets all calendar day cells
 */
export const getCalendarDays = async (): Promise<HTMLElement[]> => {
  const calendar = await getCalendarPopover();
  const days = within(calendar).queryAllByRole('gridcell');
  return days.filter((day): day is HTMLElement => day instanceof HTMLElement);
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
