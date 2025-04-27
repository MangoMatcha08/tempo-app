
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';
import { TEST_IDS } from '@/test/test-ids';
import { 
  openCalendar,
  selectDate,
  verifySelectedDate
} from '@/utils/test-utils/calendarTestUtils';

describe('DatePicker Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Set a stable date for testing
    vi.setSystemTime(new Date('2024-04-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

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

    const calendar = await openCalendar(TEST_IDS.REMINDER.DATE_PICKER);
    expect(calendar).toBeInTheDocument();
  });

  it('allows date selection', async () => {
    const mockSetDate = vi.fn();
    const defaultDate = new Date('2024-04-27T12:00:00Z');
    
    render(
      <TestWrapper>
        <DatePicker 
          date={defaultDate} 
          setDate={mockSetDate}
          data-testid={TEST_IDS.REMINDER.DATE_PICKER}
        />
      </TestWrapper>
    );

    await openCalendar(TEST_IDS.REMINDER.DATE_PICKER);
    await selectDate(defaultDate);
    
    await waitFor(() => {
      expect(mockSetDate).toHaveBeenCalledWith(expect.any(Date));
    });
    
    const call = mockSetDate.mock.calls[0][0];
    expect(call instanceof Date).toBeTruthy();
    expect(call.getDate()).toBe(defaultDate.getDate());
  });
});

