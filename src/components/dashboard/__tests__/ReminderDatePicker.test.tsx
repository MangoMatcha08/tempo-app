
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';
import { 
  openDatePicker, 
  findDayCell, 
  getCalendarPopover 
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
    const targetDate = new Date('2024-04-28');
    const targetDay = targetDate.getDate().toString();

    render(
      <TestWrapper>
        <DatePicker 
          date={defaultDate} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    // Open date picker and get calendar
    const trigger = screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER);
    fireEvent.click(trigger);
    
    const calendar = await getCalendarPopover();
    
    // Find and click on the target day cell
    const dayCell = await findDayCell(targetDay);
    
    if (dayCell) {
      // Log the day cell for debugging
      testLogger.dom.logElement(dayCell);
      
      // Click directly on the day cell
      fireEvent.click(dayCell);
      
      // Verify the date was selected
      expect(mockSetDate).toHaveBeenCalled();
      const selectedDate = mockSetDate.mock.calls[0][0];
      
      if (selectedDate instanceof Date) {
        expect(selectedDate.getDate()).toBe(parseInt(targetDay));
      } else {
        throw new Error('Selected date is not a Date object');
      }
    } else {
      throw new Error(`Could not find day cell for date: ${targetDay}`);
    }
  });
});
