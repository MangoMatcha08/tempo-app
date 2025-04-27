
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ReminderPeriodSelect } from '../ReminderPeriodSelect';
import { mockPeriods } from '@/utils/reminderUtils';
import userEvent from '@testing-library/user-event';

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

  it('renders all available periods', async () => {
    render(<ReminderPeriodSelect {...mockProps} />);
    
    // Open the select dropdown
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    
    // Now we can check for the first period
    expect(screen.getByText(mockPeriods[0].name)).toBeInTheDocument();
  });

  it('calls onChange when a period is selected', async () => {
    render(<ReminderPeriodSelect {...mockProps} />);
    
    // Open the select
    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);
    
    // Click the first period option
    const option = screen.getByText(mockPeriods[0].name);
    await userEvent.click(option);
    
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
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent(selectedPeriod.name);
  });
});
