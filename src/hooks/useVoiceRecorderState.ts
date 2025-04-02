
import { useState, useEffect, useRef } from "react";
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
  
  // Ref to track if we're currently in the process of confirming a transcript
  const isConfirmingRef = useRef(false);
  
  // Reset state when modal opens
  const resetState = () => {
    console.log("Reset state called, current view:", view);
    if (!isConfirmingRef.current) {
      setTitle("");
      setTranscript("");
      setIsProcessing(false);
      setView("record");
      setProcessingResult(null);
      setPriority(ReminderPriority.MEDIUM);
      setCategory(ReminderCategory.TASK);
      setPeriodId("none");
    }
  };
  
  const handleTranscriptComplete = (text: string) => {
    console.log("Transcript complete called with:", text);
    if (!text || !text.trim()) {
      console.log("Empty transcript received, not processing");
      return;
    }
    
    // Set the confirming flag to prevent accidental resets
    isConfirmingRef.current = true;
    
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      console.log("Processing voice input:", text);
      // Process the transcript with NLP
      const result = processVoiceInput(text);
      console.log("NLP processing result:", result);
      
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
      
      // Ensure we have a due date (default to tomorrow if not detected)
      if (!result.reminder.dueDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        result.reminder.dueDate = tomorrow;
      }
      
      setProcessingResult(result);
      
      console.log("Switching to confirmation view with result:", result);
      
      // First finish processing, then switch to confirmation view
      setIsProcessing(false);
      
      // Use setTimeout to ensure state updates properly between transitions
      setTimeout(() => {
        console.log("Setting view to confirm");
        setView("confirm");
      }, 100);
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      isConfirmingRef.current = false;
      
      toast({
        title: "Processing Error",
        description: "There was an error processing your voice input. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancel = () => {
    isConfirmingRef.current = false;
    resetState();
    onOpenChange(false);
  };

  const handleGoBack = () => {
    setView("record");
    isConfirmingRef.current = false;
  };
  
  // For debugging
  useEffect(() => {
    console.log("Voice recorder state changed:", {
      view, 
      isProcessing, 
      hasTranscript: !!transcript,
      hasResult: !!processingResult
    });
  }, [view, transcript, isProcessing, processingResult]);
  
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
