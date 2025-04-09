
# Notification System Type Documentation

This document outlines the key types used in the notification system, explaining their purpose and structure to prevent future type misalignments.

## Core Types

### `NotificationSettings`

The main configuration object that controls how notifications are delivered.

```typescript
interface NotificationSettings {
  enabled: boolean;
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary?: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
  push: {
    enabled: boolean;
    minPriority: ReminderPriority;
  };
  inApp: {
    enabled: boolean;
    minPriority: ReminderPriority;
  };
  quietHours?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };
}
```

### `ExtendedNotificationSettings`

An extended version of `NotificationSettings` used in forms to ensure nested objects are fully defined.

```typescript
interface ExtendedNotificationSettings extends NotificationSettings {
  email: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority;
    dailySummary: {  // Note: Not optional in this interface
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
}
```

### `NotificationDeliveryStatus`

Enum representing the possible states of a notification.

```typescript
enum NotificationDeliveryStatus {
  PENDING = 'pending',   // Initial state when created
  SENT = 'sent',         // Successfully delivered
  FAILED = 'failed',     // Delivery failed 
  READ = 'read',         // User has read the notification
  ARCHIVED = 'archived', // User has archived the notification
}
```

### `FormFieldPath`

Type-safe paths for form fields to ensure type correctness in form components.

```typescript
type FormFieldPath = 
  | 'enabled'
  | 'email.enabled'
  | 'email.address'
  | 'email.minPriority'
  | 'email.dailySummary.enabled'
  | 'email.dailySummary.timing'
  | 'push.enabled'
  | 'push.minPriority'
  | 'push.urgentOnly'
  | 'inApp.enabled'
  | 'inApp.minPriority'
  | 'inApp.toast'
  | 'inApp.notificationCenter'
  | 'quietHours.enabled'
  | 'quietHours.startTime'
  | 'quietHours.endTime'
  | `quietHours.daysOfWeek.${number}`;
```

## Platform-Specific Types

### `PlatformCapabilities`

Represents what features are available on the current platform.

```typescript
interface PlatformCapabilities {
  serviceWorker: boolean;
  pushManager: boolean;
  notifications: boolean;
  periodicSync: boolean;
  backgroundSync: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  isPwa: boolean;
  installable: boolean;
  standalone: boolean;
  displayMode: 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  iosVersion: number | null;
  iosSupportsPush: boolean;
  notificationPermission: NotificationPermission;
  maxActions: number;
  requiresUserInteraction: boolean;
  supportsVibration: boolean;
  detectionMethod: 'capability' | 'useragent' | 'mixed';
  userAgent: string;
}
```

## Best Practices

1. **Always use enums for status values**: Prefer `NotificationDeliveryStatus.PENDING` over string literals.

2. **Provide defaults for optional properties**: When accessing optional properties, use nullish coalescing: `settings.email?.address ?? ''`.

3. **Use type assertions wisely**: Only use type assertions (`as`) when you're sure about the type.

4. **Validate form fields with path types**: Use `FormFieldPath` to ensure form fields are correctly typed.

5. **Consider using Zod for runtime validation**: For critical data paths, consider adding runtime validation.
