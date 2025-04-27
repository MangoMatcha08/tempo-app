
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderCard from '@/components/dashboard/ReminderCard';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority } from '@/types/reminderTypes';
import userEvent from '@testing-library/user-event';
import { testLogger } from '@/utils/test-utils/testDebugUtils';

// Shorter timeouts for waitFor to quickly detect failures
const TEST_TIMEOUT = 5000;
const WAIT_OPTIONS = { timeout: 2000 };

describe('ReminderCard Component', () => {
  beforeEach(() => {
    mockDate('2024-04-27T12:00:00Z');
  });

  afterEach(() => {
    restoreDate();
    vi.clearAllMocks();
  });

  it('displays formatted date correctly', async () => {
    const reminder = createMockReminder({
      dueDate: new Date('2024-04-28T14:30:00Z'),
      title: 'Test Reminder',
      priority: ReminderPriority.HIGH
    });

    render(
      <TestWrapper>
        <ReminderCard reminder={reminder} />
      </TestWrapper>
    );

    // Wait for date elements with shorter timeout
    await waitFor(() => {
      const dateElement = screen.getByTestId('reminder-date');
      expect(dateElement).toBeInTheDocument();
    }, WAIT_OPTIONS);
    
    // Once we know the elements exist, perform the assertions
    expect(screen.getByTestId('reminder-date')).toHaveTextContent('Apr 28');
    expect(screen.getByTestId('reminder-time')).toHaveTextContent('2:30 PM');
  }, TEST_TIMEOUT); // Add explicit timeout to test

  it('handles completion correctly', async () => {
    const mockComplete = vi.fn().mockResolvedValue(true);
    const reminder = createMockReminder({
      id: 'test-reminder-1',
      dueDate: new Date()
    });

    render(
      <TestWrapper>
        <ReminderCard 
          reminder={reminder} 
          onComplete={mockComplete}
        />
      </TestWrapper>
    );

    // Check that the button exists first
    await waitFor(() => {
      const completeButton = screen.getByTestId('complete-button');
      expect(completeButton).toBeInTheDocument();
    }, WAIT_OPTIONS);

    // Then click it
    const completeButton = screen.getByTestId('complete-button');
    await act(async () => {
      await userEvent.click(completeButton);
    });

    // Verify mock was called
    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('test-reminder-1');
    }, WAIT_OPTIONS);
  }, TEST_TIMEOUT); // Add explicit timeout to test

  it('shows pending state correctly', () => {
    const reminder = createMockReminder({
      dueDate: new Date(),
      title: 'Test Reminder'
    });

    render(
      <TestWrapper>
        <ReminderCard 
          reminder={reminder} 
          isPending={true}
        />
      </TestWrapper>
    );

    // These are synchronous checks, no need for waitFor
    expect(screen.getByText(/Syncing/i)).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});
