
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EnhancedVoiceRecorderView from "./voice-recorder/EnhancedVoiceRecorderView";
import VoiceReminderConfirmView from "./VoiceReminderConfirmView";
import VoiceReminderProcessingView from "./VoiceReminderProcessingView";
import { useVoiceRecorderState } from "@/hooks/useVoiceRecorderState";
import { useToast } from "@/hooks/use-toast";
import { VoiceProcessingResult } from "@/types/reminderTypes";
import { getEnvironmentDescription } from "@/hooks/speech-recognition/environmentDetection";

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (reminder: any) => void;
  onReminderCreated?: (reminder: any) => Promise<void | boolean> | void;
}

const VoiceRecorderModal = ({ open, onOpenChange, onSave, onReminderCreated }: VoiceRecorderModalProps) => {
  // Detect environment for voice recorder optimizations
  const [environment, setEnvironment] = useState(() => {
    const env = getEnvironmentDescription();
    console.log("Voice recorder environment:", env);
    return {
      isPwa: env.isPwa,
      isIOS: env.platform === 'iOS',
      isIOSPwa: env.platform === 'iOS' && env.isPwa,
      browser: env.browser
    };
  });

  const {
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
  } = useVoiceRecorderState(onOpenChange, environment);
  
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log when modal opens or closes
  useEffect(() => {
    console.log(`Voice recorder modal ${open ? 'opened' : 'closed'} in ${environment.isPwa ? 'PWA' : 'browser'} mode`);
    
    if (!open) {
      // Reset state when modal is closed
      resetState();
    }
  }, [open, resetState, environment.isPwa]);

  const handleSave = async () => {
    if (!processingResult) return;
    
    try {
      setIsSubmitting(true);
      
      // Create reminder from processing result and user edits
      const reminder = {
        ...processingResult.reminder,
        title,
        priority,
        category,
        periodId,
      };
      
      // Save the reminder using either callback
      if (onReminderCreated) {
        await onReminderCreated(reminder);
      } else if (onSave) {
        await onSave(reminder);
      }
      
      toast({
        title: "Voice reminder created",
        description: "Your voice reminder has been created successfully."
      });
      
      // Reset state and close modal
      resetState();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast({
        title: "Error saving reminder",
        description: "There was an error saving your reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultComplete = (result: VoiceProcessingResult) => {
    console.log("Voice processing result:", result);
    // This is handled by the useVoiceRecorderState hook
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {view === "record" ? "Record a Voice Reminder" : "Confirm Voice Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {view === "record" ? (
            <EnhancedVoiceRecorderView 
              onTranscriptComplete={handleTranscriptComplete} 
              onResultComplete={handleResultComplete}
              isProcessing={isProcessing} 
            />
          ) : isProcessing ? (
            <VoiceReminderProcessingView />
          ) : (
            <VoiceReminderConfirmView
              title={title}
              setTitle={setTitle}
              transcript={transcript}
              priority={priority}
              setPriority={setPriority}
              category={category}
              setCategory={setCategory}
              periodId={periodId}
              setPeriodId={setPeriodId}
              processingResult={processingResult}
              onSave={handleSave}
              onCancel={handleCancel}
              onGoBack={handleGoBack}
            />
          )}
        </div>
        
        {view === "record" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
