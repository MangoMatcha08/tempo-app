
/**
 * This file provides component aliases for dashboard modals.
 * It re-exports existing components under new names to improve semantic clarity
 * while maintaining their original implementation.
 * 
 * @module components/dashboard/DialogAliases
 */

// Re-export components with more descriptive names
export { default as AddReminderDialog } from "./QuickReminderModal";
export { default as VoiceNoteDialog } from "./VoiceRecorderModal";
export { EnhancedReminderCreator as EnhancedReminderDialog } from "./enhanced-reminder";
