
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';

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
      expect(mockOnReminderCreated).not.toHaveBeenCalled();
    });
  });
  
  describe('date selection', () => {
    it('renders with initial date picker state', () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const dateButton = screen.getByTestId('reminder-date-picker');
      expect(dateButton).toBeInTheDocument();
      expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
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
      expect(mockOnReminderCreated).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
