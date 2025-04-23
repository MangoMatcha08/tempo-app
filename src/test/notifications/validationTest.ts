
import { vi, describe, test, expect } from 'vitest';
import { validateToken } from '@/services/notifications/tokenManager';
import { NotificationSettings } from '@/types/notifications/settingsTypes';
import { shouldSendNotification } from '@/services/notifications/settings';
import { ReminderPriority } from '@/types/reminderTypes';

describe('Notification Validation Tests', () => {
  describe('Token Validation', () => {
    test('validates correct token format', () => {
      const validToken = 'eXaMpLeToKeN123456789...';
      expect(validateToken(validToken)).toBe(true);
    });

    test('rejects invalid tokens', () => {
      const invalidTokens = [
        '',
        'too-short',
        null,
        undefined,
        123,
        {},
        []
      ];

      invalidTokens.forEach(token => {
        expect(validateToken(token as any)).toBe(false);
      });
    });
  });

  describe('Notification Settings Validation', () => {
    const validSettings: NotificationSettings = {
      enabled: true,
      email: {
        enabled: true,
        minPriority: ReminderPriority.MEDIUM,
        dailySummary: {
          enabled: false,
          timing: 'after'
        }
      },
      push: {
        enabled: true,
        minPriority: ReminderPriority.LOW
      },
      inApp: {
        enabled: true,
        minPriority: ReminderPriority.LOW
      }
    };

    test('validates notification sending conditions', () => {
      expect(shouldSendNotification(
        ReminderPriority.HIGH,
        validSettings,
        'push'
      )).toBe(true);

      expect(shouldSendNotification(
        ReminderPriority.LOW,
        validSettings,
        'email'
      )).toBe(false);
    });

    test('handles disabled notification channels', () => {
      const disabledSettings = {
        ...validSettings,
        push: { ...validSettings.push, enabled: false }
      };

      expect(shouldSendNotification(
        ReminderPriority.HIGH,
        disabledSettings,
        'push'
      )).toBe(false);
    });
  });
});
