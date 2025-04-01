
import { useState, useEffect } from "react";
import { VoiceProcessingResult, ReminderPriority, ReminderCategory } from "@/types/reminderTypes";
import { generateMeaningfulTitle } from "@/utils/voiceReminderUtils";
import { processVoiceInput } from "@/services/nlp";
import { useToast } from "@/hooks/use-toast";

export function useVoiceRecorderState(onOpenChange: (open: boolean) => void) {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<"record" | "confirm">("record");
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [priority, setPriority] = useState<ReminderPriority>(ReminderPriority.MEDIUM);
  const [category, setCategory] = useState<ReminderCategory>(ReminderCategory.TASK);
  const [periodId, setPeriodId] = useState<string>("none");
  const { toast } = useToast();
  
  // Reset state when modal opens
  const resetState = () => {
    setTitle("");
    setTranscript("");
    setIsProcessing(false);
    setView("record");
    setProcessingResult(null);
    setPriority(ReminderPriority.MEDIUM);
    setCategory(ReminderCategory.TASK);
    setPeriodId("none");
  };
  
  const handleTranscriptComplete = (text: string) => {
    console.log("Transcript complete called with:", text);
    if (!text || !text.trim()) {
      console.log("Empty transcript received, not processing");
      return;
    }
    
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      console.log("Processing voice input:", text);
      // Process the transcript with NLP
      const result = processVoiceInput(text);
      
      // Generate a better title based on category and content
      const generatedTitle = generateMeaningfulTitle(
        result.reminder.category || ReminderCategory.TASK, 
        text
      );
      
      // Set the processed data
      setTitle(generatedTitle);
      setPriority(result.reminder.priority || ReminderPriority.MEDIUM);
      setCategory(result.reminder.category || ReminderCategory.TASK);
      setPeriodId(result.reminder.periodId || "none");
      setProcessingResult(result);
      
      console.log("Switching to confirmation view with result:", result);
      // Switch to confirmation view
      setView("confirm");
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancel = () => {
    resetState();
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setView("record");
  };
  
  return {
    title,
    setTitle,
    transcript,
    isProcessing,
    view,
    processingResult,
    priority,
    setPriority,
    category,
    setCategory,
    periodId,
    setPeriodId,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState
  };
}
