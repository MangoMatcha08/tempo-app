
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { TestWrapper } from '@/test/test-wrapper';
import { TEST_IDS } from '@/test/test-ids';
import { selectDate } from '@/utils/test-utils/calendarTestUtils';

describe('QuickReminderModal DatePicker', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnReminderCreated = vi.fn();
  
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2024-04-27T12:00:00Z'));
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderModal = () => {
    return render(
      <TestWrapper>
        <QuickReminderModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onReminderCreated={mockOnReminderCreated}
        />
      </TestWrapper>
    );
  };

  it('displays current date by default', () => {
    renderModal();
    const dateButton = screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER);
    expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
  });

  it('allows selecting current date', async () => {
    renderModal();
    const today = new Date('2024-04-27T12:00:00Z');
    await selectDate(TEST_IDS.REMINDER.DATE_PICKER, today);

    const dateButton = screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER);
    expect(dateButton).toHaveTextContent(format(today, 'PPP'));
  });

  it('allows selecting tomorrow', async () => {
    renderModal();
    const tomorrow = new Date('2024-04-28T12:00:00Z');
    await selectDate(TEST_IDS.REMINDER.DATE_PICKER, tomorrow);
    
    const dateButton = screen.getByTestId(TEST_IDS.REMINDER.DATE_PICKER);
    expect(dateButton).toHaveTextContent(format(tomorrow, 'PPP'));
  });
});
