
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceReminderConfirmView from "./VoiceReminderConfirmView";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";
import { Reminder } from "@/types/reminderTypes";
import { useVoiceRecorderState } from "@/hooks/useVoiceRecorderState";
import VoiceRecorderView from "./voice-recorder/VoiceRecorderView";
import ModalFooterActions from "./voice-recorder/ModalFooterActions";

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: (reminder: Reminder) => void;
}

const VoiceRecorderModal = ({ open, onOpenChange, onReminderCreated }: VoiceRecorderModalProps) => {
  const { 
    title, setTitle,
    transcript,
    isProcessing,
    view,
    processingResult,
    priority, setPriority,
    category, setCategory,
    periodId, setPeriodId,
    handleTranscriptComplete,
    handleCancel,
    handleGoBack,
    resetState
  } = useVoiceRecorderState(onOpenChange);
  
  const { toast } = useToast();
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const lastOpenStateRef = useRef(open);
  
  // Only reset state when modal changes from closed to open
  useEffect(() => {
    if (open && !lastOpenStateRef.current) {
      console.log("Modal opened, resetting state");
      resetState();
    }
    lastOpenStateRef.current = open;
  }, [open, resetState]);
  
  // Scroll to the bottom when view changes to confirm
  useEffect(() => {
    if (view === "confirm" && dialogContentRef.current) {
      console.log("View changed to confirm, scrolling to bottom");
      setTimeout(() => {
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTop = dialogContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [view, processingResult]);
  
  // Debug logging for view state
  useEffect(() => {
    console.log("Current view:", view);
  }, [view]);
  
  // Monitor transcript changes
  useEffect(() => {
    console.log("Transcript updated:", transcript);
  }, [transcript]);
  
  const handleSave = () => {
    if (!transcript || !title) {
      console.error("Cannot save: missing title or transcript");
      return;
    }
    
    try {
      console.log("Creating reminder with:", {
        title,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        dueDate: processingResult?.reminder.dueDate
      });
      
      // Create reminder with the confirmed data
      const reminderInput = {
        title,
        description: transcript,
        priority,
        category,
        periodId: periodId === "none" ? undefined : periodId,
        voiceTranscript: transcript,
        checklist: processingResult?.reminder.checklist || [],
        // Use the processed date if available
        dueDate: processingResult?.reminder.dueDate
      };
      
      const newReminder = createReminder(reminderInput);
      console.log("Created reminder:", newReminder);
      
      // Call the callback if provided
      if (onReminderCreated) {
        console.log("Calling onReminderCreated with new reminder");
        onReminderCreated(newReminder);
      } else {
        console.warn("onReminderCreated callback is not provided");
      }
      
      toast({
        title: "Reminder Created",
        description: "Your voice reminder has been created successfully."
      });
      
      // Reset and close
      handleCancel();
    } catch (error) {
      console.error("Error saving voice reminder:", error);
      
      toast({
        title: "Save Error",
        description: "There was an error saving your reminder. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Fixed: Always use the transcript to determine view, not an arbitrary check
  const shouldShowConfirmView = transcript && view === "confirm";

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpenState) => {
        // When closing the modal
        if (!newOpenState && shouldShowConfirmView) {
          // Show confirmation before closing if we're in confirm view
          console.log("Attempt to close dialog while in confirm view");
          const shouldClose = window.confirm("Are you sure you want to discard this reminder?");
          if (shouldClose) {
            onOpenChange(false);
          }
        } else {
          onOpenChange(newOpenState);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto" ref={dialogContentRef}>
        <DialogHeader>
          <DialogTitle>
            {shouldShowConfirmView ? "Confirm Your Reminder" : "Record Voice Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-10rem)]">
          {shouldShowConfirmView ? (
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
          ) : (
            <VoiceRecorderView 
              onTranscriptComplete={handleTranscriptComplete}
              isProcessing={isProcessing}
            />
          )}
        </ScrollArea>
        
        <ModalFooterActions
          view={shouldShowConfirmView ? "confirm" : "record"}
          onCancel={handleCancel}
          onGoBack={handleGoBack}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
