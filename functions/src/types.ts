import { Timestamp } from "firebase-admin/firestore";

export enum ReminderPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export enum ReminderCategory {
  TASK = "task",
  MEETING = "meeting",
  DEADLINE = "deadline",
  PREPARATION = "preparation",
  GRADING = "grading",
  COMMUNICATION = "communication",
  OTHER = "other"
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
  dueDate: Timestamp;
  priority: ReminderPriority | string;
  category: ReminderCategory | string;
  completed: boolean;
  userId: string;
  periodId?: string;
  completedAt?: Timestamp;
  overdueNotified?: boolean;
  checklist?: {
    id: string;
    text: string;
    isCompleted: boolean;
  }[];
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
