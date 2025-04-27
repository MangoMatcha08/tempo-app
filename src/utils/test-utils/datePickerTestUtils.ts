
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { format } from 'date-fns';

/**
 * Gets the opened calendar dialog/popover
 */
async function getCalendarDialog() {
  // First try to find by test id
  try {
    const element = await screen.findByTestId('date-picker-calendar', {}, { timeout: 1000 });
    return element;
  } catch (e) {
    // Then try to find by aria-label
    try {
      const element = await screen.findByRole('dialog', { name: /calendar/i }, { timeout: 1000 });
      return element;
    } catch (e2) {
      // Finally, try to find any popover that contains a calendar
      const dialogs = screen.queryAllByRole('dialog');
      // Find the one with calendar class inside
      const calendar = dialogs.find(dialog => dialog.querySelector('.rdp'));
      return calendar || null;
    }
  }
}

/**
 * Navigates to the specified month in the calendar
 */
async function navigateToMonth(calendar: HTMLElement, targetDate: Date) {
  // Get the current month header element
  const monthHeaderElement = calendar.querySelector('[aria-live="polite"]');
  if (!monthHeaderElement) {
    throw new Error('Could not find month header element');
  }

  let currentMonthText = monthHeaderElement.textContent || '';
  const targetMonthText = format(targetDate, 'MMMM yyyy');
  
  console.log(`Current month: "${currentMonthText}", Target month: "${targetMonthText}"`);
  
  // Navigate months until we find the target month
  let attempts = 0;
  const maxAttempts = 24; // Maximum 2 years of navigation
  
  while (currentMonthText !== targetMonthText && attempts < maxAttempts) {
    const isNext = new Date(currentMonthText) < targetDate;
    const navigationButtons = within(calendar).getAllByRole('button', {
      name: isNext ? /next/i : /previous/i
    });

    // Find the correct navigation button (next/previous month)
    const navButton = navigationButtons.find(button => {
      const ariaLabel = button.getAttribute('aria-label') || '';
      return isNext 
        ? /next month|go to next/i.test(ariaLabel) 
        : /previous month|go to previous/i.test(ariaLabel);
    });

    if (!navButton) {
      throw new Error(`Could not find ${isNext ? 'next' : 'previous'} month button`);
    }

    console.log(`Clicking ${isNext ? 'next' : 'previous'} month button`);
    fireEvent.click(navButton);
    
    // Wait for month to update
    await waitFor(() => {
      const updatedText = monthHeaderElement.textContent || '';
      if (updatedText === currentMonthText) {
        throw new Error('Month text did not update after navigation');
      }
      currentMonthText = updatedText;
      console.log(`Month updated to: ${currentMonthText}`);
    }, { timeout: 1000 });
    
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error(`Failed to navigate to month ${targetMonthText} after ${maxAttempts} attempts`);
  }
  
  return true; // Successfully navigated to desired month
}

/**
 * Selects a date in the calendar picker
 */
export async function selectDate(date: Date) {
  console.log('Starting date selection for:', format(date, 'PPP'));
  
  // Open calendar
  const dateButton = screen.getByTestId('reminder-date-picker');
  console.log('Found date picker button with text:', dateButton.textContent);
  fireEvent.click(dateButton);
  
  // Wait for calendar dialog to open
  console.log('Waiting for calendar dialog...');
  const calendarDialog = await getCalendarDialog();
  if (!calendarDialog) {
    throw new Error('Calendar dialog not found after clicking date button');
  }
  console.log('Calendar dialog found');
  
  // Navigate to correct month
  await navigateToMonth(calendarDialog, date);
  
  // Format the date we're looking for
  const dayString = format(date, 'd');
  console.log('Looking for day cell with text:', dayString);
  
  // Find all the day cells
  const dayCells = within(calendarDialog).getAllByRole('gridcell');
  console.log(`Found ${dayCells.length} day cells`);
  
  // Find the cell that contains our target date
  // We need to find a button within the cell that has the right text AND is not a day outside the month
  const targetCell = dayCells.find(cell => {
    const button = cell.querySelector('button');
    // Check if the button has the day number we want and is not an outside day
    return button && 
      button.textContent === dayString && 
      !button.classList.contains('day-outside');
  });
  
  if (!targetCell) {
    console.error('Available day cells:');
    dayCells.forEach(cell => {
      const button = cell.querySelector('button');
      console.log(`Cell button text: "${button?.textContent}", outside: ${button?.classList.contains('day-outside')}`);
    });
    throw new Error(`Could not find cell for date ${dayString}`);
  }
  
  console.log('Found target day cell, clicking it');
  // Click the cell's button (not the cell itself)
  const button = targetCell.querySelector('button');
  if (!button) {
    throw new Error('Button not found in target cell');
  }
  
  fireEvent.click(button);
  
  // Wait for selection to be applied and reflected in the button text
  console.log('Waiting for date button to update...');
  await waitFor(() => {
    const updatedButton = screen.getByTestId('reminder-date-picker');
    const buttonText = updatedButton.textContent || '';
    console.log('Date button text:', buttonText);
    expect(buttonText).toContain(format(date, 'PPP'));
  }, { timeout: 2000 });
  
  console.log('Date selection complete');
  return screen.getByTestId('reminder-date-picker');
}

/**
 * Get day grid cells from calendar
 */
export function getCalendarDayCells(calendarDialog: HTMLElement) {
  return within(calendarDialog).getAllByRole('gridcell');
}

/**
 * Get day button by text
 */
export function getDayButtonByText(calendarDialog: HTMLElement, dayText: string) {
  const cells = getCalendarDayCells(calendarDialog);
  const targetCell = cells.find(cell => {
    const button = cell.querySelector('button');
    return button && button.textContent === dayText;
  });
  
  return targetCell ? targetCell.querySelector('button') : null;
}

/**
 * Helper function to find selected day in calendar
 */
export function getSelectedDay(calendarDialog: HTMLElement) {
  return within(calendarDialog).getByRole('button', {
    selected: true,
  });
}
