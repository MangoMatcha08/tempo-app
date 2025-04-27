
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

/**
 * Helper to find elements within portals (like dialogs, popovers)
 */
export const getPortalRoot = (): HTMLElement | null => {
  return document.querySelector("[role='dialog']") as HTMLElement;
};

/**
 * Enhanced query that works with portaled content
 */
export const queryPortaled = (matcher: Parameters<typeof screen.queryByText>[0]) => {
  // Try normal query first
  let element = screen.queryByText(matcher);
  
  // If not found, try in portal
  if (!element) {
    const portal = getPortalRoot();
    if (portal) {
      element = within(portal).queryByText(matcher);
    }
  }
  
  return element;
};

/**
 * Helper for Shadcn select components
 */
export const openSelect = async (labelText: string) => {
  const trigger = screen.getByLabelText(labelText);
  await userEvent.click(trigger);
  
  // Wait for select content to be visible
  await waitFor(() => {
    const content = document.querySelector('[role="listbox"]');
    expect(content).toBeInTheDocument();
  });
};

/**
 * Helper for selecting an option in Shadcn select
 */
export const selectOption = async (labelText: string, optionText: string) => {
  await openSelect(labelText);
  
  const option = screen.getByRole('option', { name: optionText });
  await userEvent.click(option);
  
  // Wait for select to close
  await waitFor(() => {
    const content = document.querySelector('[role="listbox"]');
    expect(content).not.toBeInTheDocument();
  });
};

/**
 * Helper for Shadcn DatePicker
 */
export const openDatePicker = async () => {
  const trigger = screen.getByTestId('reminder-date-picker');
  await userEvent.click(trigger);
  
  // Wait for calendar to be visible
  await waitFor(() => {
    const calendar = document.querySelector('.rdp');
    expect(calendar).toBeInTheDocument();
  });
  
  return trigger;
};

/**
 * Helper for selecting a date in Shadcn DatePicker
 */
export const selectDate = async (date: Date) => {
  await openDatePicker();
  
  const dayText = format(date, 'd');
  const dayCell = screen.getByRole('gridcell', { name: dayText });
  await userEvent.click(dayCell);
  
  // Wait for date to be selected
  await waitFor(() => {
    const trigger = screen.getByTestId('reminder-date-picker');
    expect(trigger).toHaveTextContent(format(date, 'PPP'));
  });
};

/**
 * Type-safe render function with portal support
 */
export const renderWithPortal = (ui: React.ReactElement) => {
  return {
    ...render(ui),
    queryPortaled
  };
};
