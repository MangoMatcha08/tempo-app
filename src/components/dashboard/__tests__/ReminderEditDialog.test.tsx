import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderEditDialog from '@/components/dashboard/ReminderEditDialog';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import userEvent from '@testing-library/user-event';

describe.skip('ReminderEditDialog Component', () => {
  const mockOnSave = vi.fn().mockResolvedValue(true);
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockDate('2024-04-27T12:00:00Z');
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreDate();
  });

  it('renders with reminder data', async () => {
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

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Reminder')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    }, { timeout: 5000 });
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

    const titleInput = await screen.findByLabelText(/title/i);
    await userEvent.clear(titleInput);
    
    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    }, { timeout: 5000 });
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

    const titleInput = await screen.findByLabelText(/title/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Title');
    
    const saveButton = screen.getByText('Save Changes');
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ...reminder,
          title: 'Updated Title'
        })
      );
    }, { timeout: 5000 });
  });
});
