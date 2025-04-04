export enum ReminderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ReminderCategory {
  TASK = 'TASK',
  MEETING = 'MEETING',
  DEADLINE = 'DEADLINE',
  PREPARATION = 'PREPARATION',
  GRADING = 'GRADING',
  COMMUNICATION = 'COMMUNICATION',
  OTHER = 'OTHER'
}

export interface ChecklistItem {
  id?: string;
  text: string;
  isCompleted: boolean;
}

export interface NewPeriodInfo {
  name: string;
  isNew: boolean;
}

export interface CreateReminderInput {
  title: string;
  description: string;
  priority: ReminderPriority;
  category: ReminderCategory;
  periodId?: string;
  dueDate?: Date;
  checklist?: ChecklistItem[];
  voiceTranscript?: string;
  detectedNewPeriod?: NewPeriodInfo;
  location?: string;
}

export interface Reminder extends CreateReminderInput {
  id: string;
  createdAt: Date;
  completed: boolean;
  completedAt?: Date;
  userId?: string;
}

export interface VoiceProcessingResult {
  reminder: CreateReminderInput;
  confidence: number;
  detectedEntities: {
    priority: ReminderPriority;
    category: ReminderCategory;
    period?: string;
    date?: Date | null;
    newPeriod?: string;
    checklist?: string[];
  };
}
