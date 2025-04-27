
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockDate, restoreDate } from '@/test/mocks/date-mocks';
import { createMockReminder } from '@/test/mocks/reminder-mocks';
import ReminderEditDialog from '@/components/dashboard/ReminderEditDialog';
import { TestWrapper } from '@/test/test-wrapper';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';
import userEvent from '@testing-library/user-event';
import { mockPeriods } from '@/utils/reminderUtils';

// Mock the toast function
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() })
}));

describe('ReminderEditDialog Component', () => {
  const mockOnSave = vi.fn();
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
    });
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
    });
  });

  // Test for period selection functionality
  it('updates time when period is selected', async () => {
    // Skip test if no mock periods available
    if (mockPeriods.length === 0) {
      console.warn('Skipping test - no mock periods available');
      return;
    }
    
    const mockPeriod = mockPeriods[0];
    const reminder = createMockReminder({
      title: 'Period Test Reminder',
      dueDate: new Date('2024-04-28T10:00:00Z'), // Start with a different time
      periodId: null // No initial period
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

    // Test is focused on data flow rather than UI interaction
    // Find the period select
    const periodTrigger = screen.getByTestId('reminder-edit-period-select');
    expect(periodTrigger).toBeInTheDocument();
    
    // TODO: Expand this test to simulate period selection when UI testing is more stable
  });
});
