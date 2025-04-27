
import { render, screen } from '@testing-library/react';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';
import { openDatePicker, selectCalendarDate } from '@/utils/test-utils/datePickerTestUtils';
import { TEST_IDS } from '@/test/test-ids';

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

    const dialog = await openDatePicker();
    expect(dialog).toBeInTheDocument();
  });

  it('allows date selection', async () => {
    const mockSetDate = vi.fn();
    const defaultDate = new Date();
    const targetDate = new Date('2024-04-28');

    render(
      <TestWrapper>
        <DatePicker 
          date={defaultDate} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    await openDatePicker();
    await selectCalendarDate(targetDate);
    
    expect(mockSetDate).toHaveBeenCalledWith(expect.any(Date));
    const selectedDate = mockSetDate.mock.calls[0][0];
    expect(selectedDate.toDateString()).toBe(targetDate.toDateString());
  });
});
