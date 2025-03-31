
import { VoiceProcessingResult } from "@/types/reminderTypes";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowUpCircle } from "lucide-react";

interface TranscriptDisplayProps {
  transcript: string;
  processingResult?: VoiceProcessingResult | null;
  showEntities?: boolean;
}

const TranscriptDisplay = ({ 
  transcript, 
  processingResult, 
  showEntities = true 
}: TranscriptDisplayProps) => {
  const hasEntities = processingResult && Object.values(processingResult.detectedEntities).some(value => !!value);
  
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Original Input</label>
        <div className="p-3 bg-muted/30 rounded-md text-sm italic">
          {transcript}
        </div>
      </div>
      
      {showEntities && hasEntities && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span>Detected Entities</span>
          </label>
          
          <div className="flex flex-wrap gap-2">
            {processingResult?.detectedEntities.priority && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <ArrowUpCircle className="h-3 w-3" />
                <span>Priority: {processingResult.detectedEntities.priority}</span>
              </Badge>
            )}
            
            {processingResult?.detectedEntities.category && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Category: {processingResult.detectedEntities.category}</span>
              </Badge>
            )}
            
            {processingResult?.detectedEntities.period && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Period: {processingResult.detectedEntities.period}</span>
              </Badge>
            )}
            
            {processingResult?.detectedEntities.newPeriod && (
              <Badge variant="outline" className="flex gap-1 items-center bg-blue-50">
                <span>New Period: {processingResult.detectedEntities.newPeriod}</span>
              </Badge>
            )}
            
            {processingResult?.detectedEntities.checklist && processingResult.detectedEntities.checklist.length > 0 && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Checklist Items: {processingResult.detectedEntities.checklist.length}</span>
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            Confidence: {Math.round(processingResult?.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
