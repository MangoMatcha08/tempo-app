
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import NotificationCard from '../NotificationCard';
import { NotificationRecord } from '@/types/notifications/notificationHistoryTypes';
import { NotificationType, ReminderPriority } from '@/types/reminderTypes';
import { NotificationDeliveryStatus } from '@/types/notifications/notificationHistoryTypes';
import { NotificationChannel } from '@/types/notifications/settingsTypes';

describe('NotificationCard', () => {
  const mockNotification: NotificationRecord = {
    id: 'test-notification-1',
    title: 'Test Notification',
    body: 'This is a test notification body',
    timestamp: Date.now(),
    type: NotificationType.TEST,
    reminderId: 'reminder-123',
    priority: ReminderPriority.MEDIUM,
    status: NotificationDeliveryStatus.SENT,
    channels: [NotificationChannel.IN_APP]
  };

  const mockHandlers = {
    onAction: vi.fn(),
    onMarkRead: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification details correctly', () => {
    render(<NotificationCard 
      notification={mockNotification}
      onAction={mockHandlers.onAction}
      onMarkRead={mockHandlers.onMarkRead}
    />);
    
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification body')).toBeInTheDocument();
  });

  it('should call onMarkRead when clicking on an unread notification', () => {
    const unreadNotification = {
      ...mockNotification,
      status: NotificationDeliveryStatus.SENT
    };
    
    render(<NotificationCard 
      notification={unreadNotification}
      onAction={mockHandlers.onAction}
      onMarkRead={mockHandlers.onMarkRead}
    />);
    
    fireEvent.click(screen.getByText('Test Notification'));
    
    expect(mockHandlers.onMarkRead).toHaveBeenCalled();
  });

  it('should not call onMarkRead when clicking on an already read notification', () => {
    const readNotification = {
      ...mockNotification,
      status: NotificationDeliveryStatus.RECEIVED
    };
    
    render(<NotificationCard 
      notification={readNotification}
      onAction={mockHandlers.onAction}
      onMarkRead={mockHandlers.onMarkRead}
    />);
    
    fireEvent.click(screen.getByText('Test Notification'));
    
    expect(mockHandlers.onMarkRead).not.toHaveBeenCalled();
  });

  it('should call onAction with "view" when clicking the View button', () => {
    render(<NotificationCard 
      notification={mockNotification}
      onAction={mockHandlers.onAction}
      onMarkRead={mockHandlers.onMarkRead}
    />);
    
    fireEvent.click(screen.getByText('View'));
    
    expect(mockHandlers.onAction).toHaveBeenCalledWith('view');
  });

  it('should call onAction with "dismiss" when clicking the Dismiss button', () => {
    render(<NotificationCard 
      notification={mockNotification}
      onAction={mockHandlers.onAction}
      onMarkRead={mockHandlers.onMarkRead}
    />);
    
    fireEvent.click(screen.getByText('Dismiss'));
    
    expect(mockHandlers.onAction).toHaveBeenCalledWith('dismiss');
  });

  it('should not render View button if there is no reminderId', () => {
    const notificationWithoutReminder = {
      ...mockNotification,
      reminderId: undefined
    };
    
    render(<NotificationCard 
      notification={notificationWithoutReminder}
      onAction={mockHandlers.onAction}
      onMarkRead={mockHandlers.onMarkRead}
    />);
    
    expect(screen.queryByText('View', { exact: false })).not.toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
});
