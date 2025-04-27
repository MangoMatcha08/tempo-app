
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderCard from '@/components/dashboard/ReminderCard';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority } from '@/types/reminderTypes';
import userEvent from '@testing-library/user-event';

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

    // Use more specific selectors and shorter timeouts
    await waitFor(() => {
      const dateElement = screen.getByTestId('reminder-date');
      const timeElement = screen.getByTestId('reminder-time');
      
      expect(dateElement).toBeInTheDocument();
      expect(timeElement).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByTestId('reminder-date')).toHaveTextContent('Apr 28');
    expect(screen.getByTestId('reminder-time')).toHaveTextContent('2:30 PM');
  });

  it('handles completion correctly', async () => {
    const mockComplete = vi.fn().mockResolvedValue(true); // Ensure it returns a resolved promise
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

    // Use userEvent instead of fireEvent for better simulation
    const completeButton = screen.getByTestId('complete-button');
    await userEvent.click(completeButton);

    // Verify the mock was called with the correct ID
    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('test-reminder-1');
    }, { timeout: 5000 });
  });

  it('shows pending state correctly', async () => {
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

    expect(screen.getByText(/Syncing/i)).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});
