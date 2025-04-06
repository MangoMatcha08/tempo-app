
import { Reminder } from './reminder';

export enum ReminderPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
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

export interface BaseReminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: ReminderPriority;
  completed?: boolean;
  completedAt?: Date;
  createdAt: Date;
  userId?: string;
  category?: ReminderCategory;
  periodId?: string;
  location?: string;
}

export interface ChecklistItem {
  id?: string;
  text: string;
  isCompleted: boolean;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  dueDate: Date;
  priority: ReminderPriority;
  category?: ReminderCategory;
  periodId?: string;
  voiceTranscript?: string;
  checklist?: ChecklistItem[];
  detectedNewPeriod?: {
    name: string;
    isNew: boolean;
  };
}

export interface UIReminder {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: ReminderPriority;
  completed?: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  category?: ReminderCategory;
  periodId?: string;
  checklist?: ChecklistItem[];
  location?: string;
  // UI-specific properties
  timeRemaining?: string;
  formattedDate?: string;
  completedTimeAgo?: string;
}

export type DatabaseReminder = {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: ReminderPriority;
  completed?: boolean;
  completedAt?: Date;
  createdAt: Date;
  userId: string;
  category?: ReminderCategory;
  location?: string;
};

export type VoiceProcessingResult = {
  reminder: Partial<Reminder>;
  confidence?: number;
  detectedEntities?: {
    priority?: ReminderPriority;
    category?: ReminderCategory;
    period?: string;
    date?: Date;
    time?: Date;
    newPeriod?: string;
    checklist?: string[];
  };
};

// Recorder state type for voice recognition state machine
export type RecorderState = 
  | { status: 'idle' }
  | { status: 'requesting-permission' }
  | { status: 'recording' }
  | { status: 'recovering' }
  | { status: 'processing', transcript: string }
  | { status: 'confirming', result: VoiceProcessingResult }
  | { status: 'error', message: string };
