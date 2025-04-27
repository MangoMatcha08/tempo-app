import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { selectDate } from './test-utils';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('QuickReminderModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnReminderCreated = vi.fn();
  
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onReminderCreated: mockOnReminderCreated
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders with default values', () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create reminder/i })).toBeInTheDocument();
  });
  
  it('validates required title field', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const createButton = screen.getByRole('button', { name: /create reminder/i });
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Title Required",
        description: "Please enter a title for your reminder",
        variant: "destructive"
      });
    });
  });
  
  describe('date selection', () => {
    it('renders with initial date picker state', () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const dateButton = screen.getByTestId('reminder-date-picker');
      expect(dateButton).toHaveTextContent(/pick a date/i);
    });
    
    it('handles date selection correctly', async () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const today = new Date();
      const updatedDateButton = await selectDate(today);
      
      expect(updatedDateButton).toHaveTextContent(format(today, 'PPP'));
    });
  });
  
  it('creates reminder successfully', async () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    // Fill in required fields
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Reminder' } });
    
    // Submit form
    const createButton = screen.getByRole('button', { name: /create reminder/i });
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Reminder Created",
        description: '"Test Reminder" has been added to your reminders.'
      });
      expect(mockOnReminderCreated).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
