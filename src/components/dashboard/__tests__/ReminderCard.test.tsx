
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderCard from '@/components/dashboard/ReminderCard';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority } from '@/types/reminderTypes';

describe('ReminderCard Component', () => {
  afterEach(() => {
    restoreDate();
  });

  it('displays formatted date correctly', () => {
    mockDate('2024-04-27T12:00:00Z');
    
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

    expect(screen.getByText(/Apr 28/i)).toBeInTheDocument();
    expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
  });

  it('handles completion correctly', () => {
    const mockComplete = vi.fn();
    const reminder = createMockReminder({
      dueDate: new Date(),
      title: 'Test Reminder'
    });

    render(
      <TestWrapper>
        <ReminderCard 
          reminder={reminder} 
          onComplete={mockComplete}
        />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText(/Complete/i));
    expect(mockComplete).toHaveBeenCalledWith(reminder.id);
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
    expect(screen.getByRole('button', { name: /Complete/i })).toBeDisabled();
  });
});
