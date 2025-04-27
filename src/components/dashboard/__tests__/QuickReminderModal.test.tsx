
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { format } from 'date-fns';
import QuickReminderModal from '../QuickReminderModal';
import { toFirestoreDate } from '@/lib/firebase/dateConversions';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
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
  
  it('validates required title field', () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const createButton = screen.getByRole('button', { name: /create reminder/i });
    fireEvent.click(createButton);
    
    expect(screen.getByText(/title required/i)).toBeInTheDocument();
  });
  
  it('handles date selection correctly', () => {
    render(<QuickReminderModal {...defaultProps} />);
    
    const dateButton = screen.getByRole('button', { name: /pick a date/i });
    fireEvent.click(dateButton);
    
    // Calendar should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Select today's date
    const today = new Date();
    const formattedDate = format(today, 'PPP');
    const dateCell = screen.getByRole('button', { name: new RegExp(format(today, 'd')) });
    fireEvent.click(dateCell);
    
    expect(dateButton).toHaveTextContent(formattedDate);
  });
});
