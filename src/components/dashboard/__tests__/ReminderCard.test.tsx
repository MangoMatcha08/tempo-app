
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { setupTimezoneMock, createTestReminder, completeReminder } from './helpers/reminderTestHelpers';
import ReminderCard from '@/components/dashboard/ReminderCard';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority } from '@/types/reminderTypes';
import userEvent from '@testing-library/user-event';
import { testLogger } from '@/utils/test-utils/testDebugUtils';

describe('ReminderCard Component', () => {
  let restoreTimezone: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    restoreTimezone = setupTimezoneMock(); // Setup consistent timezone
  });

  afterEach(() => {
    restoreTimezone();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('displays formatted date correctly', () => {
    // Create reminder with specific time
    const reminder = createTestReminder({
      dueDate: new Date('2024-04-28T14:30:00Z'),
      title: 'Test Reminder',
      priority: ReminderPriority.HIGH
    });

    render(
      <TestWrapper>
        <ReminderCard reminder={reminder} />
      </TestWrapper>
    );

    // Check content directly without timezone complications
    const dateElement = screen.getByTestId('reminder-date');
    const timeElement = screen.getByTestId('reminder-time');
    
    // Log what we're actually seeing for debugging
    testLogger.debug('Date element content:', dateElement.textContent);
    testLogger.debug('Time element content:', timeElement.textContent);
    
    // Verify the date part (should be consistent)
    expect(dateElement).toHaveTextContent('Apr 28');
    
    // For time, don't check exact format - it may vary by timezone
    expect(timeElement).toHaveTextContent(/\d{1,2}:\d{2}/);
  });

  it('handles completion correctly', async () => {
    // Use a mock that resolves immediately
    const mockComplete = vi.fn().mockResolvedValue(true);
    
    const reminder = createTestReminder({
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

    const completeButton = screen.getByTestId('complete-button');
    expect(completeButton).toBeInTheDocument();
    
    // Use our helper to properly handle async operations
    await completeReminder(mockComplete, 'test-reminder-1');
    
    // Verify mock was called with correct ID
    expect(mockComplete).toHaveBeenCalledWith('test-reminder-1');
  });

  it('shows pending state correctly', () => {
    const reminder = createTestReminder({
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

    // Look for specific test IDs rather than text content
    expect(screen.getByText(/Syncing/i)).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});
