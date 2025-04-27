
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { format, addDays } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { getCalendarPopover, selectDate } from '../../../utils/test-utils/datePickerTestUtils';

describe('QuickReminderModal DatePicker', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnReminderCreated = vi.fn();
  
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onReminderCreated: mockOnReminderCreated
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays current date by default', () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
  });

  it('opens calendar on date picker click', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(dateButton);
    
    const calendar = await getCalendarPopover();
    expect(calendar).toBeInTheDocument();
  });

  it('allows selecting current date', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const today = new Date();
    await selectDate(today);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(today, 'PPP'));
  });

  it('allows selecting tomorrow', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const tomorrow = addDays(new Date(), 1);
    await selectDate(tomorrow);
    
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent(format(tomorrow, 'PPP'));
  });
});
