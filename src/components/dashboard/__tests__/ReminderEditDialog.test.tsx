
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderEditDialog from '@/components/dashboard/ReminderEditDialog';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

describe('ReminderEditDialog Component', () => {
  const mockOnSave = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockDate('2024-04-27T12:00:00Z');
  });

  afterEach(() => {
    restoreDate();
    vi.clearAllMocks();
  });

  it('renders with reminder data', () => {
    const reminder = createMockReminder({
      title: 'Test Reminder',
      description: 'Test Description',
      priority: ReminderPriority.HIGH,
      category: ReminderCategory.TASK,
      dueDate: new Date('2024-04-28T14:30:00Z')
    });

    render(
      <TestWrapper>
        <ReminderEditDialog
          reminder={reminder}
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Test Reminder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const reminder = createMockReminder({
      title: 'Test Reminder',
      dueDate: new Date()
    });

    render(
      <TestWrapper>
        <ReminderEditDialog
          reminder={reminder}
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: '' } });
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('calls onSave with updated reminder data', async () => {
    const reminder = createMockReminder({
      title: 'Original Title',
      dueDate: new Date()
    });

    render(
      <TestWrapper>
        <ReminderEditDialog
          reminder={reminder}
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
        />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ...reminder,
          title: 'Updated Title'
        })
      );
    });
  });
});
