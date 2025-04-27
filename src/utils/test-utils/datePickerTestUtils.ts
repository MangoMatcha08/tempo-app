
import { fireEvent, screen, within } from '@testing-library/react';
import { format } from 'date-fns';

/**
 * Gets the opened calendar popover content
 */
export async function getCalendarPopover() {
  return screen.findByTestId('date-picker-calendar');
}

/**
 * Gets day button in calendar by text with enhanced error handling and debugging
 */
export function getDayButtonByText(calendar: HTMLElement, dayText: string) {
  console.log('Looking for day:', dayText);
  console.log('Calendar content:', calendar.innerHTML);
  
  // First try by aria-label (Shadcn format)
  const buttons = within(calendar).getAllByRole('button');
  console.log('Found buttons:', buttons.length);
  
  // Log all button attributes for debugging
  buttons.forEach((button, index) => {
    console.log(`Button ${index}:`, {
      text: button.textContent,
      ariaLabel: button.getAttribute('aria-label'),
      role: button.getAttribute('role'),
      date: button.getAttribute('data-date')
    });
  });

  // Try to find by various date formats
  const dateFormats = ['d', 'dd', 'D'];
  for (const fmt of dateFormats) {
    const formattedDate = format(new Date(dayText), fmt);
    console.log('Trying date format:', fmt, 'Result:', formattedDate);
    
    const targetButton = buttons.find(button => {
      const label = button.getAttribute('aria-label');
      const content = button.textContent?.trim();
      return label?.includes(formattedDate) || content === formattedDate;
    });

    if (targetButton) {
      console.log('Found button with format:', fmt);
      return targetButton;
    }
  }

  // If no button found, log available buttons for debugging
  console.error('Available buttons:', 
    buttons.map(b => ({
      text: b.textContent,
      ariaLabel: b.getAttribute('aria-label'),
      date: b.getAttribute('data-date')
    }))
  );
  
  // Return null instead of throwing to allow caller to handle the error
  return null;
}

/**
 * Enhanced date selection helper with better error handling
 */
export async function selectDate(targetDate: Date) {
  console.log('Starting date selection for:', format(targetDate, 'PPP'));
  
  // Click date picker to open calendar
  const dateButton = screen.getByTestId('reminder-date-picker');
  fireEvent.click(dateButton);
  
  // Wait for calendar to open
  const calendar = await getCalendarPopover();
  
  // Format date as a string
  const dayString = format(targetDate, 'yyyy-MM-dd');
  console.log('Looking for date:', dayString);
  
  // Get the day button with enhanced error handling
  const dayButton = getDayButtonByText(calendar, dayString);
  
  if (!dayButton) {
    console.error('Failed to find date button in calendar');
    throw new Error(`Could not find button for date ${dayString}`);
  }
  
  // Click the button and verify the selection
  fireEvent.click(dayButton);
  
  // Allow a moment for state to update
  await new Promise(resolve => setTimeout(resolve, 0));
  
  return dateButton;
}
