
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBadge from '../NotificationBadge';
import { useNotificationDisplay } from '@/hooks/useNotificationDisplay';

// Mock the useNotificationDisplay hook
jest.mock('@/hooks/useNotificationDisplay', () => ({
  useNotificationDisplay: jest.fn()
}));

describe('NotificationBadge', () => {
  beforeEach(() => {
    // Reset mock before each test
    (useNotificationDisplay as jest.Mock).mockReset();
  });

  it('should render without badge when no unread notifications', () => {
    // Mock the hook return value
    (useNotificationDisplay as jest.Mock).mockReturnValue({
      unreadCount: 0
    });

    render(<NotificationBadge />);
    
    // Should render bell icon but no badge
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should render with badge when there are unread notifications', () => {
    // Mock the hook return value
    (useNotificationDisplay as jest.Mock).mockReturnValue({
      unreadCount: 5
    });

    render(<NotificationBadge />);
    
    // Should render bell icon with badge showing count
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 9+ when unread count exceeds 9', () => {
    // Mock the hook return value
    (useNotificationDisplay as jest.Mock).mockReturnValue({
      unreadCount: 15
    });

    render(<NotificationBadge />);
    
    // Should render bell icon with badge showing 9+
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    // Mock the hook return value
    (useNotificationDisplay as jest.Mock).mockReturnValue({
      unreadCount: 3
    });

    const handleClick = jest.fn();
    render(<NotificationBadge onClick={handleClick} />);
    
    // Click the button
    await userEvent.click(screen.getByRole('button'));
    
    // Should call onClick handler
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
