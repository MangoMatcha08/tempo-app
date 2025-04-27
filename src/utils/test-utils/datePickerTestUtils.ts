
import { fireEvent, screen, within } from '@testing-library/react';

/**
 * Gets the opened calendar popover content
 */
export async function getCalendarPopover() {
  return screen.findByTestId('date-picker-calendar');
}

/**
 * Gets day button in calendar by text
 */
export function getDayButtonByText(calendar: HTMLElement, dayText: string) {
  console.log('Looking for day:', dayText);
  
  // First try by aria-label (Shadcn format)
  const buttons = within(calendar).getAllByRole('button');
  const targetButton = buttons.find(button => {
    const label = button.getAttribute('aria-label');
    console.log('Checking button with aria-label:', label);
    return label && label.includes(dayText);
  });

  if (targetButton) {
    return targetButton;
  }

  // Fallback to cell content
  const cells = within(calendar).getAllByRole('gridcell');
  const targetCell = cells.find(cell => {
    const button = cell.querySelector('button');
    const text = button?.textContent;
    console.log('Checking cell button with text:', text);
    return text === dayText;
  });
  
  return targetCell?.querySelector('button') || null;
}

/**
 * Simple date selection helper
 */
export async function selectDate(targetDate: Date) {
  // Click date picker to open calendar
  const dateButton = screen.getByTestId('reminder-date-picker');
  fireEvent.click(dateButton);
  
  // Wait for calendar to open
  const calendar = await getCalendarPopover();
  
  // Get the day button and click it
  const dayString = targetDate.getDate().toString();
  const dayButton = getDayButtonByText(calendar, dayString);
  
  if (!dayButton) {
    console.error('Available buttons:', 
      within(calendar).getAllByRole('button')
        .map(b => ({
          text: b.textContent,
          ariaLabel: b.getAttribute('aria-label')
        }))
    );
    throw new Error(`Could not find button for date ${dayString}`);
  }
  
  fireEvent.click(dayButton);
  return dateButton;
}
