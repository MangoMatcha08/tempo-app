
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
  
  describe('Basic Rendering', () => {
    it('renders form elements correctly', () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create reminder/i })).toBeInTheDocument();
      expect(screen.getByTestId('reminder-date-picker')).toBeInTheDocument();
    });

    it('renders priority and category selects', () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });
  });
  
  describe('Form Validation', () => {
    it('prevents submission without title', async () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const createButton = screen.getByRole('button', { name: /create reminder/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockOnReminderCreated).not.toHaveBeenCalled();
      });
    });
    
    it('allows submission with valid title', async () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Reminder' } });
      
      const createButton = screen.getByRole('button', { name: /create reminder/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockOnReminderCreated).toHaveBeenCalled();
      });
    });
  });
  
  describe('Date Picker', () => {
    it('renders with default date', () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const dateButton = screen.getByTestId('reminder-date-picker');
      expect(dateButton).toBeInTheDocument();
      expect(dateButton).toHaveTextContent(format(new Date(), 'PPP'));
    });
  });
  
  describe('Modal Behavior', () => {
    it('calls onOpenChange when cancel is clicked', () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
    
    it('closes modal after successful reminder creation', async () => {
      render(<QuickReminderModal {...defaultProps} />);
      
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Reminder' } });
      
      const createButton = screen.getByRole('button', { name: /create reminder/i });
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
