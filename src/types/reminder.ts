
import { ReminderCategory, ReminderPriority } from "./reminderTypes";

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: ReminderPriority;
  category: ReminderCategory;
  location?: string;
  completed?: boolean;
  completedAt?: Date;
  createdAt?: Date;
  periodId?: string;
  checklist?: any[];
  voiceTranscript?: string;
}
