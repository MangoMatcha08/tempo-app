import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ReminderEditDialog from '../ReminderEditDialog';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

describe('ReminderEditDialog', () => {
  const mockReminder = {
    id: '1',
    title: 'Test Reminder',
    description: 'Test Description',
    priority: ReminderPriority.MEDIUM,
    category: ReminderCategory.TASK,
    dueDate: new Date(),
    periodId: null,
    completed: false,
    createdAt: new Date(),
    userId: 'test-user'
  };

  const mockProps = {
    reminder: mockReminder,
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with reminder data', () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    expect(screen.getByLabelText(/title/i)).toHaveValue(mockReminder.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(mockReminder.description);
  });

  it('maintains period selection when editing', async () => {
    const reminderWithPeriod = {
      ...mockReminder,
      periodId: 'morning'
    };
    
    render(<ReminderEditDialog {...mockProps} reminder={reminderWithPeriod} />);
    
    const periodSelect = screen.getByLabelText(/period/i);
    expect(periodSelect).toHaveValue('morning');
  });

  it('validates date fields and shows error messages', async () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    const dateInput = screen.getByLabelText(/due date/i);
    fireEvent.change(dateInput, { target: { value: '' } });
    
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
    });
  });

  it('handles form submission with valid data', async () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title'
        })
      );
    });
  });

  it('preserves time when changing date', async () => {
    const reminderWithTime = {
      ...mockReminder,
      dueDate: new Date('2025-04-27T10:30:00')
    };
    
    render(<ReminderEditDialog {...mockProps} reminder={reminderWithTime} />);
    
    const timeInput = screen.getByLabelText(/due time/i);
    expect(timeInput).toHaveValue('10:30');
    
    // Change date but time should remain the same
    const dateInput = screen.getByLabelText(/due date/i);
    const newDate = new Date('2025-04-28');
    fireEvent.change(dateInput, { target: { value: newDate.toISOString() } });
    
    expect(timeInput).toHaveValue('10:30');
  });
});
