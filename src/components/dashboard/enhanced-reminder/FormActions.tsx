
import React from 'react';
import { Button } from "@/components/ui/button";
import { FormActionsProps } from './types';

const FormActions: React.FC<FormActionsProps> = ({
  handleCreateReminder,
  resetForm,
  onCancel,
  isFormValid
}) => {
  return (
    <div className="flex justify-end space-x-2">
      {onCancel && (
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      )}
      <Button 
        variant="outline" 
        onClick={resetForm}
      >
        Clear
      </Button>
      <Button 
        onClick={handleCreateReminder}
        disabled={!isFormValid}
      >
        Create Reminder
      </Button>
    </div>
  );
};

export default FormActions;
