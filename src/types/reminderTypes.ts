
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
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  location?: string;
  completed?: boolean;
  completedAt?: Date;
  createdAt?: Date;
  category?: ReminderCategory;
  periodId?: string;
  checklist?: ChecklistItem[];
}

export interface VoiceProcessingResult {
  reminder: CreateReminderInput;
  confidence: number;
  detectedEntities: {
    priority?: ReminderPriority;
    category?: ReminderCategory;
    period?: string;
    newPeriod?: string;
    checklist?: string[];
    date?: Date;
    time?: Date;
  };
}
