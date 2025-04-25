// Note: 'location' and 'type' fields were removed in April 2025 to streamline the data model
// and resolve type inconsistencies across the application

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

/**
 * Types of notifications that can be sent
 * @enum {string}
 */
export enum NotificationType {
  /** Reminder for upcoming deadline */
  UPCOMING = "upcoming",
  /** Reminder for overdue task */
  OVERDUE = "overdue",
  /** Daily summary of reminders */
  DAILY_SUMMARY = "dailySummary",
  /** Test notification for debugging */
  TEST = "test"
}

/**
 * Base reminder interface with properties common to all contexts
 */
export interface BaseReminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: ReminderPriority;
  completed?: boolean;
  periodId: string | null;
  category: ReminderCategory | null;
  checklist: ChecklistItem[] | null;
}

/**
 * Database reminder with storage-specific fields
 */
export interface DatabaseReminder extends BaseReminder {
  userId?: string;
  completedAt: Date | null;
  createdAt?: Date;
  overdueNotified?: boolean;
}

/**
 * UI-specific reminder with presentation-specific fields
 */
export interface UIReminder extends BaseReminder {
  timeRemaining?: string;
  formattedDate?: string;
  completedTimeAgo?: string;
  completedAt?: Date;
  category?: ReminderCategory;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  text: string;
  isCompleted: boolean;
  id?: string;
}

export interface DetectedNewPeriod {
  name: string;
  isNew: boolean;
}

export interface CreateReminderInput {
  title: string;
  description: string;
  priority?: ReminderPriority;
  category?: ReminderCategory;
  periodId?: string;
  voiceTranscript?: string;
  checklist?: ChecklistItem[];
  detectedNewPeriod?: DetectedNewPeriod;
  dueDate?: Date;
  userId?: string;
}

// For backward compatibility and to avoid breaking existing code
export type Reminder = DatabaseReminder;

export interface VoiceProcessingResult {
  reminder: CreateReminderInput;
  confidence: number;
  detectedEntities: {
    priority?: ReminderPriority;
    category?: ReminderCategory;
    period?: string;
    periodConfidence?: number;
    newPeriod?: string;
    checklist?: string[];
    date?: Date;
    time?: Date;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  reminderId: string;
  priority: ReminderPriority;
  type: NotificationType;
  timestamp: number;
  data?: Record<string, string>;
}
