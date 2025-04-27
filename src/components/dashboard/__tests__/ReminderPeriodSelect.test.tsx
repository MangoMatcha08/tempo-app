
import { render, screen, fireEvent } from '@testing-library/react';
import { ReminderPeriodSelect } from '../ReminderPeriodSelect';
import { mockPeriods } from '@/utils/reminderUtils';

describe('ReminderPeriodSelect', () => {
  const mockProps = {
    periodId: 'none',
    onChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default "no specific period" option', () => {
    render(<ReminderPeriodSelect {...mockProps} />);
    expect(screen.getByText(/no specific period/i)).toBeInTheDocument();
  });

  it('renders all available periods', () => {
    render(<ReminderPeriodSelect {...mockProps} />);
    
    mockPeriods.forEach(period => {
      expect(screen.getByText(new RegExp(period.name, 'i'))).toBeInTheDocument();
    });
  });

  it('calls onChange when a period is selected', () => {
    render(<ReminderPeriodSelect {...mockProps} />);
    
    const select = screen.getByLabelText(/period/i);
    fireEvent.change(select, { target: { value: mockPeriods[0].id } });
    
    expect(mockProps.onChange).toHaveBeenCalledWith(mockPeriods[0].id);
  });

  it('displays the currently selected period', () => {
    const selectedPeriod = mockPeriods[0];
    render(
      <ReminderPeriodSelect 
        periodId={selectedPeriod.id} 
        onChange={mockProps.onChange} 
      />
    );
    
    expect(screen.getByLabelText(/period/i)).toHaveValue(selectedPeriod.id);
  });
});
