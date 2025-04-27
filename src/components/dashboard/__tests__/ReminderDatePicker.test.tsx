
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';
import { 
  openDatePicker, 
  findDayCell, 
  getCalendarPopover,
  selectCalendarDate
} from '@/utils/test-utils/datePickerTestUtils';
import { TEST_IDS } from '@/test/test-ids';
import { fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import { testLogger } from '@/utils/test-utils/testDebugUtils';

describe('DatePicker Component', () => {
  it('renders with default date', () => {
    const mockSetDate = vi.fn();
    const defaultDate = new Date();

    render(
      <TestWrapper>
        <DatePicker 
          date={defaultDate} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER)).toBeInTheDocument();
  });

  it('opens calendar on click', async () => {
    const mockSetDate = vi.fn();
    const defaultDate = new Date();

    render(
      <TestWrapper>
        <DatePicker 
          date={defaultDate} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    const dialog = await openDatePicker(TEST_IDS.REMINDER.DATE_PICKER);
    expect(dialog).toBeInTheDocument();
    
    // Log calendar structure for debugging
    testLogger.dom.logCalendar(dialog);
  });

  it('allows date selection', async () => {
    const mockSetDate = vi.fn();
    const defaultDate = new Date();
    const targetDate = new Date();
    
    render(
      <TestWrapper>
        <DatePicker 
          date={defaultDate} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    // Open date picker and select today's date (which is always in current month)
    await openDatePicker(TEST_IDS.REMINDER.DATE_PICKER);
    await selectCalendarDate(targetDate);
    
    // Verify the date was selected
    await waitFor(() => {
      expect(mockSetDate).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});
