
export enum ReminderPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
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
}

export interface NotificationSettings {
  enabled: boolean;
  email?: {
    enabled: boolean;
    address: string;
    minPriority: ReminderPriority | string;
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
