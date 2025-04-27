
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('displays formatted date correctly', () => {
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

    expect(screen.getByTestId('reminder-date')).toHaveTextContent('Apr 28');
    expect(screen.getByTestId('reminder-time')).toHaveTextContent('2:30 PM');
  });

  it('handles completion correctly', () => {
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

    fireEvent.click(screen.getByTestId('complete-button'));
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

    expect(screen.getByText(/Syncing/i)).toBeInTheDocument();
    expect(screen.getByTestId('complete-button')).toBeDisabled();
  });
});
