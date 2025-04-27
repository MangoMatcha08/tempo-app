
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';
import { TEST_IDS } from '@/test/test-ids';
import { openCalendar, selectDate } from '@/utils/test-utils/calendarTestUtils';
import { format } from 'date-fns';

describe('DatePicker Component', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2024-04-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    
    // Cleanup portal root
    const portal = document.getElementById('radix-portal');
    if (portal) {
      portal.remove();
    }
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

    const button = screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER);
    expect(button).toHaveTextContent(format(defaultDate, 'PPP'));
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

    await openCalendar(TEST_IDS.REMINDER.DATE_PICKER);
    const calendar = document.querySelector('[role="dialog"] .rdp');
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

    await selectDate(TEST_IDS.REMINDER.DATE_PICKER, defaultDate);

    expect(mockSetDate).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = mockSetDate.mock.calls[0][0];
    expect(format(calledDate, 'yyyy-MM-dd')).toBe('2024-04-27');
  });
});
