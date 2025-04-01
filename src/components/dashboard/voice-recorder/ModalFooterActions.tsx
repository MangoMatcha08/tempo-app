
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface ModalFooterActionsProps {
  view: "record" | "confirm";
  onCancel: () => void;
  onGoBack: () => void;
  onSave: () => void;
}

const ModalFooterActions = ({ 
  view, 
  onCancel, 
  onGoBack, 
  onSave 
}: ModalFooterActionsProps) => {
  if (view === "record") {
    return (
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </DialogFooter>
    );
  }
  
  return (
    <DialogFooter className="mt-4 pt-2 border-t">
      <Button type="button" variant="outline" onClick={onGoBack}>
        Back
      </Button>
      <Button type="button" onClick={onSave}>
        Save Reminder
      </Button>
    </DialogFooter>
  );
};

export default ModalFooterActions;
