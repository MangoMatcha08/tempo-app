
import { useEffect, useRef, useState } from "react";
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
  const [isPWA, setIsPWA] = useState(false);
  
  // Check if running as PWA
  useEffect(() => {
    // Check if app is running in standalone mode (PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      // @ts-ignore - Property 'standalone' exists on iOS Safari but not in TS types
      window.navigator.standalone === true;
    
    setIsPWA(isStandalone);
    console.log("VoiceRecorderModal running as PWA:", isStandalone);
  }, []);
  
  // When modal opens, try to request microphone permission proactively
  useEffect(() => {
    if (open && !lastOpenStateRef.current) {
      console.log("Voice modal opened, checking microphone access");
      
      // Always pre-request permission in PWA mode or on mobile
      const shouldPreRequest = isPWA || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (shouldPreRequest && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log("Pre-checking microphone permission");
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            console.log("Microphone permission pre-granted");
            // Store the stream to prevent it from being garbage collected in PWA
            if (isPWA) {
              (window as any).microphoneStream = stream;
              console.log("Stored microphone stream for PWA");
            } else {
              // Release the stream if not in PWA mode
              stream.getTracks().forEach(track => track.stop());
            }
          })
          .catch(err => {
            console.log("Microphone permission not pre-granted:", err.name);
            // We don't need to handle the error here, the VoiceRecorderView component will handle it
          });
      }
      
      console.log("Modal opened, resetting state");
      resetState();
    }
    lastOpenStateRef.current = open;
  }, [open, resetState, isPWA]);
  
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
  
  // Debug logging for view state and PWA
  useEffect(() => {
    console.log("Current view:", view, "transcript length:", transcript ? transcript.length : 0, "isPWA:", isPWA);
  }, [view, transcript, isPWA]);
  
  // Enhanced debug logging for isProcessing state
  useEffect(() => {
    console.log("Processing state:", isProcessing, "in view:", view);
  }, [isProcessing, view]);
  
  // Cleanup microphone stream when modal closes
  useEffect(() => {
    return () => {
      // Release microphone stream on modal close if we stored one
      if ((window as any).microphoneStream) {
        const tracks = (window as any).microphoneStream.getTracks();
        tracks.forEach((track: MediaStreamTrack) => track.stop());
        (window as any).microphoneStream = null;
        console.log("Microphone stream released on modal close");
      }
    };
  }, []);
  
  // Enhanced transcript handler with better logging for PWA
  const enhancedTranscriptHandler = (text: string) => {
    console.log(`Transcript complete called with text of length: ${text.length}`);
    console.log(`First 30 chars: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    if (isPWA) {
      console.log("PWA mode detected, adding slight delay before processing");
      setTimeout(() => {
        handleTranscriptComplete(text);
      }, 200);
    } else {
      handleTranscriptComplete(text);
    }
  };
  
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
        dueDate: processingResult?.reminder.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpenState) => {
        console.log("Dialog open state changing to:", newOpenState, "current view:", view);
        // When closing the modal
        if (!newOpenState && view === "confirm") {
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
            {view === "confirm" ? "Confirm Your Reminder" : "Record Voice Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(85vh-10rem)]">
          {view === "confirm" ? (
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
              onTranscriptComplete={enhancedTranscriptHandler}
              isProcessing={isProcessing}
            />
          )}
        </ScrollArea>
        
        <ModalFooterActions
          view={view === "confirm" ? "confirm" : "record"}
          onCancel={handleCancel}
          onGoBack={handleGoBack}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
