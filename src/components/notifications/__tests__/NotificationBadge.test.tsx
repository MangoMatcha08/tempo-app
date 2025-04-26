
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NotificationBadge from '../NotificationBadge';
import { useNotificationDisplay } from '@/hooks/useNotificationDisplay';

// Mock the useNotificationDisplay hook
vi.mock('@/hooks/useNotificationDisplay', () => ({
  useNotificationDisplay: vi.fn()
}));

describe('NotificationBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without badge when no unread notifications', () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 0
    });

    render(<NotificationBadge />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should render with badge when there are unread notifications', () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 5
    });

    render(<NotificationBadge />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('5');
  });

  it('should show 9+ when unread count exceeds 9', () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 15
    });

    render(<NotificationBadge />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('9+');
  });

  it('should call onClick handler when clicked', async () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 3
    });

    const handleClick = vi.fn();
    render(<NotificationBadge onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
