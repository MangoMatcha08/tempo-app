
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { format } from 'date-fns';
import { testLogger } from './testDebugUtils';

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

export async function selectCalendarDate(date: Date) {
  const formattedDay = date.getDate().toString();
  
  try {
    // Find the day cell first
    const dayCell = await waitFor(() => {
      const cell = screen.getByRole('gridcell', { name: new RegExp(`^${formattedDay}$`) });
      if (!cell) {
        // Log DOM structure for debugging
        const calendar = screen.getByRole('application');
        testLogger.dom.logStructure(calendar);
        throw new Error(`Could not find gridcell for date: ${formattedDay}`);
      }
      return cell;
    });

    // Log the found cell's structure
    testLogger.dom.logElement(dayCell);

    // Find button within the cell using 'within'
    const dayButton = within(dayCell).getByRole('button');
    if (!dayButton) {
      testLogger.dom.logElement(dayCell);
      throw new Error(`Could not find button inside gridcell for date: ${formattedDay}`);
    }

    // Click the button
    await act(async () => {
      await userEvent.click(dayButton);
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

export async function verifySelectedDate(expectedDate: Date, testId = 'reminder-date-picker') {
  const trigger = screen.getByTestId(testId);
  await waitFor(() => {
    expect(trigger).toHaveTextContent(format(expectedDate, 'PPP'));
  }, { timeout: 5000 });
}

export const getCalendarPopover = async () => {
  return waitFor(() => {
    const popover = screen.getByTestId('date-picker-calendar');
    expect(popover).toBeInTheDocument();
    return popover;
  }, { timeout: 5000 });
};

