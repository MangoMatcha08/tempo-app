
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Helper to find elements within portals
 */
const getCalendarDialog = () => {
  return screen.getByRole('dialog');
};

/**
 * Opens the calendar by clicking the trigger button
 */
export const openCalendar = async (testId: string) => {
  console.log('Opening calendar...');
  const trigger = screen.getByTestId(testId);
  await userEvent.click(trigger);
  
  await waitFor(() => {
    const dialog = getCalendarDialog();
    expect(dialog).toBeInTheDocument();
  });
  
  console.log('Calendar opened successfully');
  return trigger;
};

/**
 * Finds and clicks the date button in the calendar
 */
export const selectDate = async (testId: string, date: Date, retries = 3) => {
  console.log('Selecting date:', format(date, 'PPP'));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${retries}`);
      
      // Open calendar
      await openCalendar(testId);
      
      // Get the dialog content
      const dialog = getCalendarDialog();
      
      // Find and click the date cell
      const dayText = format(date, 'd');
      const dateCell = within(dialog).getByRole('gridcell', { name: dayText });
      await userEvent.click(dateCell);
      
      // Wait for date to be selected and calendar to close
      await waitFor(() => {
        const trigger = screen.getByTestId(testId);
        const formattedDate = format(date, 'PPP');
        expect(trigger).toHaveTextContent(formattedDate);
      });
      
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        throw new Error(`Failed to select date after ${retries} attempts. Last error: ${error}`);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

