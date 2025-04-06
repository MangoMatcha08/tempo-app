import { Reminder } from './reminder';

export enum ReminderPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

export enum ReminderCategory {
  WORK = "work",
  PERSONAL = "personal",
  HEALTH = "health",
  SHOPPING = "shopping",
  OTHER = "other"
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
  location?: string;
};

export type VoiceProcessingResult = {
  reminder: Partial<Reminder>;
  confidence?: number;
  detectedEntities?: Array<{
    entity: string;
    type: string;
    confidence: number;
  }>;
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
