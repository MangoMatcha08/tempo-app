
import { render, screen, waitFor, act } from '@testing-library/react';
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

    // Use more direct selectors with shorter timeouts
    const dateElement = screen.getByTestId('reminder-date');
    const timeElement = screen.getByTestId('reminder-time');
    
    // Verify the content
    expect(dateElement).toHaveTextContent('Apr 28');
    expect(timeElement).toHaveTextContent('2:30 PM');
  });

  it('handles completion correctly', async () => {
    // Create a mock that resolves immediately to avoid timing issues
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

    // Get button and click immediately
    const completeButton = screen.getByTestId('complete-button');
    expect(completeButton).toBeInTheDocument();
    
    // Click and verify mock was called
    await act(async () => {
      await userEvent.click(completeButton);
    });
    
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

    // These are synchronous checks, no need for waitFor
    expect(screen.getByText(/Syncing/i)).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});
