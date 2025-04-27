import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testLogger } from './testDebugUtils';

export async function openDatePicker(testId = 'reminder-date-picker'): Promise<HTMLElement> {
  const trigger = screen.getByTestId(testId);
  try {
    await userEvent.click(trigger);
    
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

export async function findDayCell(dayText: string): Promise<HTMLElement> {
  try {
    const calendar = await getCalendarPopover();
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

export async function selectCalendarDate(date: Date): Promise<boolean> {
  const formattedDay = date.getDate().toString();
  
  try {
    const calendar = await getCalendarPopover();
    const cells = within(calendar).queryAllByRole('gridcell');
    testLogger.debug(`Found ${cells.length} gridcells in calendar`);
    
    const foundCell = cells.find(cell => {
      if (cell instanceof HTMLElement) {
        return cell.textContent?.trim() === formattedDay;
      }
      return false;
    });
    
    if (!foundCell || !(foundCell instanceof HTMLElement)) {
      testLogger.debug('Available day cells:');
      cells.forEach(cell => {
        if (cell instanceof HTMLElement) {
          testLogger.debug(`Cell content: "${cell.textContent?.trim()}"`);
        }
      });
      throw new Error(`Could not find gridcell for date: ${formattedDay}`);
    }
    
    await userEvent.click(foundCell);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  } catch (error) {
    testLogger.error('Error selecting date:', error);
    throw error;
  }
}

export const getCalendarPopover = async (): Promise<HTMLElement> => {
  return waitFor(() => {
    const popover = screen.getByTestId('date-picker-calendar');
    expect(popover).toBeInTheDocument();
    return popover;
  }, { timeout: 5000 });
};

export const getCalendarDays = async (): Promise<HTMLElement[]> => {
  const calendar = await getCalendarPopover();
  const days = within(calendar).queryAllByRole('gridcell');
  return days.filter((day): day is HTMLElement => day instanceof HTMLElement);
};

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
