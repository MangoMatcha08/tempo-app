
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DatePicker } from "@/components/ui/date-picker";
import { TestWrapper } from '@/test/test-wrapper';
import { 
  openDatePicker, 
  getCalendarPopover,
  selectCalendarDate
} from '@/utils/test-utils/datePickerTestUtils';
import { TEST_IDS } from '@/test/test-ids';
import { format } from 'date-fns';
import { testLogger } from '@/utils/test-utils/testDebugUtils';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

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

    const dialog = await openDatePicker(TEST_IDS.REMINDER.DATE_PICKER);
    expect(dialog).toBeInTheDocument();
    
    // Debug log calendar structure
    testLogger.dom.logCalendar(dialog);
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

    // Open date picker
    await openDatePicker(TEST_IDS.REMINDER.DATE_PICKER);
    
    // Get calendar element
    const calendar = await getCalendarPopover();
    
    // Find all day buttons (they have role="gridcell")
    const days = within(calendar).getAllByRole('gridcell');
    testLogger.debug(`Found ${days.length} day cells`);
    
    // Find the "27" day button (today)
    const dayText = '27';
    const dayButton = Array.from(days).find(day => 
      day.textContent?.trim() === dayText
    );
    
    // Verify we found it
    expect(dayButton).toBeDefined();
    
    if (dayButton) {
      // Click the day button
      await act(async () => {
        await userEvent.click(dayButton);
      });
    }
    
    // Verify mockSetDate was called with a date object
    await waitFor(() => {
      expect(mockSetDate).toHaveBeenCalled();
    }, { timeout: 1000 });
    
    const call = mockSetDate.mock.calls[0][0];
    expect(call instanceof Date).toBeTruthy();
  });
});
