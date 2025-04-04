
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Save } from "lucide-react";

export interface ReminderActionButtonsProps {
  onSave: () => void;
  onGoBack?: () => void;
  isSaving?: boolean;
}

const ReminderActionButtons: React.FC<ReminderActionButtonsProps> = ({
  onSave,
  onGoBack,
  isSaving = false
}) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      {onGoBack && (
        <Button variant="outline" onClick={onGoBack} disabled={isSaving}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Reminder
          </>
        )}
      </Button>
    </div>
  );
};

export default ReminderActionButtons;
