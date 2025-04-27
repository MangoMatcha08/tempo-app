
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderCard from '@/components/dashboard/ReminderCard';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority } from '@/types/reminderTypes';
import userEvent from '@testing-library/user-event';
import { testLogger } from '@/utils/test-utils/testDebugUtils';

describe('ReminderCard Component', () => {
  beforeEach(() => {
    mockDate('2024-04-27T12:00:00Z');
    vi.useFakeTimers();
  });

  afterEach(() => {
    restoreDate();
    vi.clearAllMocks();
    vi.useRealTimers();
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

    // Use direct selectors
    const dateElement = screen.getByTestId('reminder-date');
    const timeElement = screen.getByTestId('reminder-time');
    
    // Verify the content
    expect(dateElement).toHaveTextContent('Apr 28');
    expect(timeElement).toHaveTextContent('2:30 PM');
  });

  it('handles completion correctly', async () => {
    // Create a mock that doesn't actually remove the component during test
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

    // Get button
    const completeButton = screen.getByTestId('complete-button');
    expect(completeButton).toBeInTheDocument();
    
    // Click and verify mock was called immediately without waiting for state updates
    await act(async () => {
      await userEvent.click(completeButton);
    });
    
    // Only check if the function was called with the right ID
    expect(mockComplete).toHaveBeenCalledWith('test-reminder-1');
  });

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

    // These are synchronous checks
    expect(screen.getByText(/Syncing/i)).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});
