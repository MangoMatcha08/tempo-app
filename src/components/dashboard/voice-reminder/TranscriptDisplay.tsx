
import { VoiceProcessingResult } from "@/types/reminderTypes";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowUpCircle, Calendar, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

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
  const hasEntities = processingResult?.detectedEntities && 
    (processingResult.detectedEntities.priority ||
     processingResult.detectedEntities.category ||
     processingResult.detectedEntities.period ||
     processingResult.detectedEntities.date ||
     processingResult.detectedEntities.time ||
     processingResult.detectedEntities.newPeriod ||
     (processingResult.detectedEntities.checklist && processingResult.detectedEntities.checklist.length > 0));
  
  // Format transcript with proper sentence capitalization and punctuation
  const formatTranscript = (text: string): string => {
    if (!text) return "";
    
    // Split into sentences (considering various end punctuation)
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    // Format each sentence
    return sentences.map(sentence => {
      // Capitalize first letter of each sentence
      let formatted = sentence.trim();
      if (formatted.length > 0) {
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
      
      // Ensure sentence ends with punctuation
      if (formatted.length > 0 && !formatted.match(/[.!?]$/)) {
        formatted += '.';
      }
      
      return formatted;
    }).join(' ');
  };
  
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Original Input</label>
        <ScrollArea className="h-auto max-h-[150px]">
          <div className="p-3 bg-muted/30 rounded-md text-sm">
            {formatTranscript(transcript)}
          </div>
        </ScrollArea>
      </div>
      
      {showEntities && hasEntities && processingResult?.detectedEntities && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span>Detected Entities</span>
          </label>
          
          <div className="flex flex-wrap gap-2">
            {processingResult.detectedEntities.priority && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <ArrowUpCircle className="h-3 w-3" />
                <span>Priority: {processingResult.detectedEntities.priority}</span>
              </Badge>
            )}
            
            {processingResult.detectedEntities.category && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Category: {processingResult.detectedEntities.category}</span>
              </Badge>
            )}
            
            {processingResult.detectedEntities.period && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Period: {processingResult.detectedEntities.period}</span>
              </Badge>
            )}
            
            {processingResult.detectedEntities.date && (
              <Badge variant="outline" className="flex gap-1 items-center bg-blue-50">
                <Calendar className="h-3 w-3" />
                <span>Date: {format(processingResult.detectedEntities.date, 'MMMM d, yyyy')}</span>
              </Badge>
            )}
            
            {processingResult.detectedEntities.time && (
              <Badge variant="outline" className="flex gap-1 items-center bg-blue-50">
                <Clock className="h-3 w-3" />
                <span>Time: {format(processingResult.detectedEntities.time, 'h:mm a')}</span>
              </Badge>
            )}
            
            {processingResult.detectedEntities.newPeriod && (
              <Badge variant="outline" className="flex gap-1 items-center bg-blue-50">
                <span>New Period: {processingResult.detectedEntities.newPeriod}</span>
              </Badge>
            )}
            
            {processingResult.detectedEntities.checklist && processingResult.detectedEntities.checklist.length > 0 && (
              <Badge variant="outline" className="flex gap-1 items-center">
                <span>Checklist Items: {processingResult.detectedEntities.checklist.length}</span>
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-1">
            Confidence: {Math.round((processingResult?.confidence || 0) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay;
