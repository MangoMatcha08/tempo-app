
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderCard from '@/components/dashboard/ReminderCard';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority } from '@/types/reminderTypes';

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

    // Wait for date elements to be rendered
    await waitFor(() => {
      const dateSpan = screen.getByTestId('reminder-date');
      const timeSpan = screen.getByTestId('reminder-time');
      expect(dateSpan).toHaveTextContent('Apr 28');
      expect(timeSpan).toHaveTextContent('2:30 PM');
    });
  });

  it('handles completion correctly', async () => {
    const mockComplete = vi.fn();
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

    const completeButton = screen.getByTestId('complete-button');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('test-reminder-1');
    });
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
