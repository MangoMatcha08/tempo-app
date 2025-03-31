
import { ChecklistItem } from "@/types/reminderTypes";

interface ChecklistDisplayProps {
  checklist?: ChecklistItem[];
}

const ChecklistDisplay = ({ checklist }: ChecklistDisplayProps) => {
  if (!checklist || checklist.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Detected Checklist Items</label>
      <div className="p-3 bg-muted/30 rounded-md text-sm">
        <ul className="list-disc pl-5 space-y-1">
          {checklist.map((item, index) => (
            <li key={index}>{item.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChecklistDisplay;
