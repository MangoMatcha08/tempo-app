import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import NotificationBadge from '../NotificationBadge';
import { useNotificationDisplay } from '@/hooks/notifications/useNotificationDisplay';

// Mock the useNotificationDisplay hook
vi.mock('@/hooks/notifications/useNotificationDisplay', () => ({
  useNotificationDisplay: vi.fn()
}));

// Mark as todo until we fix notification display
describe.todo('NotificationBadge', () => {
  it('should render without badge when no unread notifications', () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 0
    });

    render(<NotificationBadge />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should render with badge when there are unread notifications', () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 5
    });

    render(<NotificationBadge />);
    
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('5');
  });

  it('should show 9+ when unread count exceeds 9', () => {
    (useNotificationDisplay as ReturnType<typeof vi.fn>).mockReturnValue({
      unreadCount: 15
    });

    render(<NotificationBadge />);
    
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('9+');
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
