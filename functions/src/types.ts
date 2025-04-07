
export enum ReminderPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export enum NotificationTypes {
  UPCOMING = "upcoming",
  OVERDUE = "overdue",
  DAILY_SUMMARY = "dailySummary",
  TEST = "test"
}

export interface Reminder {
  id?: string;
  title: string;
  description: string;
  dueDate: FirebaseFirestore.Timestamp;
  priority: ReminderPriority | string;
  completed: boolean;
  userId: string;
  periodId?: string;
  location?: string;
  completedAt?: FirebaseFirestore.Timestamp;
  overdueNotified?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  email?: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority | string;
    dailySummary?: {
      enabled: boolean;
      timing: 'before' | 'after';
    };
  };
  push: {
    enabled: boolean;
    minPriority: ReminderPriority | string;
  };
  inApp?: {
    enabled: boolean;
    minPriority: ReminderPriority | string;
  };
}
