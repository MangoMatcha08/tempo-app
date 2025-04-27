
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { getCalendarPopover, selectDate } from '@/utils/test-utils/datePickerTestUtils';
import { TEST_IDS } from '@/test/test-ids';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';

describe('DatePicker Component', () => {
  afterEach(() => {
    restoreDate();
  });

  it('renders with default date', () => {
    const mockSetDate = vi.fn();
    mockDate('2024-04-27');

    render(
      <TestWrapper>
        <DatePicker 
          date={new Date()} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER)).toBeInTheDocument();
  });

  it('opens calendar on click', async () => {
    const mockSetDate = vi.fn();
    mockDate('2024-04-27');

    render(
      <TestWrapper>
        <DatePicker 
          date={new Date()} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER));
    const calendar = await getCalendarPopover();
    expect(calendar).toBeInTheDocument();
  });

  it('allows date selection', async () => {
    const mockSetDate = vi.fn();
    mockDate('2024-04-27');

    render(
      <TestWrapper>
        <DatePicker 
          date={new Date()} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    const targetDate = new Date('2024-04-28');
    await selectDate(targetDate);

    expect(mockSetDate).toHaveBeenCalledWith(expect.any(Date));
    const selectedDate = mockSetDate.mock.calls[0][0];
    expect(selectedDate.toDateString()).toBe(targetDate.toDateString());
  });
});
