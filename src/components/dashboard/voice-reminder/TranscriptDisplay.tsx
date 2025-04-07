
import { VoiceProcessingResult } from "@/types/reminderTypes";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TranscriptDisplayProps {
  transcript: string;
  processingResult: VoiceProcessingResult | null;
}

const TranscriptDisplay = ({ transcript, processingResult }: TranscriptDisplayProps) => {
  // Format date to display
  const formattedDate = processingResult?.reminder.dueDate 
    ? format(new Date(processingResult.reminder.dueDate), 'MMM d, yyyy h:mm a')
    : 'Not specified';

  // Get period confidence if available
  const periodConfidence = processingResult?.detectedEntities?.periodConfidence;
  const isPeriodConfident = periodConfidence && periodConfidence >= 0.6;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Voice Transcript</label>
        <div className="flex gap-1">
          {processingResult?.detectedEntities?.date && (
            <Badge variant="outline" className="text-xs">
              Due: {formattedDate}
            </Badge>
          )}
          
          {processingResult?.reminder.periodId && (
            <Badge 
              variant={isPeriodConfident ? "default" : "secondary"} 
              className={`text-xs ${isPeriodConfident ? "bg-green-500" : "bg-yellow-500"}`}
            >
              Period: {isPeriodConfident ? "✓" : "?"} 
              {periodConfidence ? ` (${Math.round(periodConfidence * 100)}%)` : ''}
            </Badge>
          )}
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm">
        {transcript}
      </div>
    </div>
  );
};

export default TranscriptDisplay;
