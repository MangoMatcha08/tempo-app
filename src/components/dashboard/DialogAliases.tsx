
/**
 * DialogAliases.tsx
 * 
 * This file provides standardized naming for dialog components used in the dashboard.
 * It re-exports existing components under consistent naming conventions to improve
 * code readability and maintainability.
 * 
 * Using aliases instead of wrapper components allows for:
 * 1. Zero runtime overhead
 * 2. Preservation of TypeScript types
 * 3. Easier maintenance as component APIs evolve
 */

import React from "react";
import { QuickReminderModal, QuickReminderModalProps } from "./QuickReminderModal";
import { VoiceRecorderModal, VoiceRecorderModalProps } from "./VoiceRecorderModal";
import { EnhancedReminderCreator } from "./EnhancedReminderCreator";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Re-export QuickReminderModal as AddReminderDialog
export { QuickReminderModal as AddReminderDialog };
export type { QuickReminderModalProps as AddReminderDialogProps };

// Re-export VoiceRecorderModal as VoiceNoteDialog
export { VoiceRecorderModal as VoiceNoteDialog };
export type { VoiceRecorderModalProps as VoiceNoteDialogProps };

/**
 * EnhancedReminderDialog - A dialog wrapper for EnhancedReminderCreator
 * This component combines the Dialog UI with the EnhancedReminderCreator content
 */
export interface EnhancedReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: any) => void;
}

export const EnhancedReminderDialog: React.FC<EnhancedReminderDialogProps> = ({ 
  open, 
  onOpenChange, 
  onReminderCreated 
}) => {
  const handleReminderCreated = (reminder: any) => {
    if (onReminderCreated) {
      onReminderCreated(reminder);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <EnhancedReminderCreator
          onReminderCreated={handleReminderCreated}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
