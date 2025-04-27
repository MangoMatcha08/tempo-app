
import { screen, waitFor, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testLogger } from './testDebugUtils';
import { format } from 'date-fns';

/**
 * Opens a date picker by clicking its trigger element
 */
export async function openDatePicker(testId = 'reminder-date-picker'): Promise<HTMLElement> {
  try {
    const trigger = screen.getByTestId(testId);
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
export const getCalendarPopover = async (): Promise<HTMLElement> => {
  return waitFor(() => {
    const popover = screen.getByTestId('date-picker-calendar');
    expect(popover).toBeInTheDocument();
    return popover;
  }, { timeout: 2000 });
};

/**
 * Selects a date in the calendar
 * Properly handles Shadcn calendar component
 */
export async function selectCalendarDate(date: Date): Promise<void> {
  const formattedDay = format(date, 'd'); // Get day number as string
  
  try {
    const calendar = await getCalendarPopover();
    
    // Find the day button
    const dayButtons = within(calendar).queryAllByRole('button');
    const dayButton = dayButtons.find(button => 
      button.textContent?.trim() === formattedDay
    );
    
    if (!dayButton) {
      testLogger.error('Available day buttons:', dayButtons.map(b => b.textContent));
      throw new Error(`Could not find button for date: ${formattedDay}`);
    }

    await act(async () => {
      await userEvent.click(dayButton);
      // Small delay for state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Wait for popover to close
    await waitFor(() => {
      const popover = screen.queryByTestId('date-picker-calendar');
      expect(popover).not.toBeInTheDocument();
    }, { timeout: 1000 });

  } catch (error) {
    testLogger.error('Error selecting date:', error);
    throw error;
  }
}

/**
 * Gets all calendar day cells
 */
export const getCalendarDays = async (): Promise<HTMLElement[]> => {
  const calendar = await getCalendarPopover();
  const days = within(calendar).queryAllByRole('button', { name: /\d+/ });
  return days.filter((day): day is HTMLElement => day instanceof HTMLElement);
};

