
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ReminderEditDialog from '../ReminderEditDialog';
import { ReminderPriority, ReminderCategory } from '@/types/reminderTypes';

// Mock the date to ensure consistent testing
const MOCK_DATE = new Date('2025-04-27T10:00:00Z');

describe('ReminderEditDialog', () => {
  const mockReminder = {
    id: '1',
    title: 'Test Reminder',
    description: 'Test Description',
    priority: ReminderPriority.MEDIUM,
    category: ReminderCategory.TASK,
    dueDate: MOCK_DATE,
    periodId: null,
    completed: false,
    createdAt: new Date(),
    userId: 'test-user',
    checklist: null
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
    expect(screen.getByText(/edit reminder/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Reminder')).toBeInTheDocument();
  });

  it('handles period selection without losing time', async () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    const periodSelect = screen.getByLabelText(/period/i);
    expect(periodSelect).toBeInTheDocument();
    
    fireEvent.click(periodSelect);
    
    // Wait for the select content to be visible
    await waitFor(() => {
      expect(screen.getByText(/morning/i)).toBeInTheDocument();
    });
    
    // Select a period
    fireEvent.click(screen.getByText(/morning/i));
    
    // Verify time is preserved in the date picker
    const dateButton = screen.getByTestId('reminder-date-picker');
    expect(dateButton).toHaveTextContent('10:00');
  });

  it('validates required fields before saving', async () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    // Clear the title
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: '' } });
    
    // Try to save
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    // Check for validation message
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    
    // Verify save was not called
    expect(mockProps.onSave).not.toHaveBeenCalled();
  });

  it('handles date validation', async () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    // Open the date picker
    const datePickerButton = screen.getByTestId('reminder-date-picker');
    fireEvent.click(datePickerButton);
    
    // Wait for calendar to be visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Select a date (27th of current month)
    const dayButton = screen.getByRole('gridcell', { name: '27' });
    fireEvent.click(dayButton);
    
    // Verify the date was selected
    expect(datePickerButton).toHaveTextContent('27');
  });

  it('handles form submission with all fields', async () => {
    render(<ReminderEditDialog {...mockProps} />);
    
    // Update title
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    // Click save
    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);
    
    // Verify save was called with updated data
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          id: '1'
        })
      );
    });
    
    // Verify dialog closes
    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
