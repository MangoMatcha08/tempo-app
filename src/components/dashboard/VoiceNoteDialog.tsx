
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreateReminderInput } from "@/types/reminderTypes";
import { Mic, Loader, StopCircle, Save } from "lucide-react";

interface VoiceNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddReminder: (reminder: CreateReminderInput) => Promise<boolean>;
}

const VoiceNoteDialog = ({ open, onOpenChange, onAddReminder }: VoiceNoteDialogProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setIsRecording(false);
      setTranscript("");
      setError(null);
      setIsProcessing(false);
    }
  }, [open]);

  // Mock function to simulate voice recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulating a transcript that would normally come from speech recognition
      setTranscript("Remember to prepare the quarterly report by next Friday.");
    } else {
      setIsRecording(true);
      setTranscript("");
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      setError("No voice content detected. Please try again.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // In a real implementation, this would process the voice transcript
      // and extract date, priority, etc. using NLP
      const basicReminder: CreateReminderInput = {
        title: transcript.substring(0, 50) + (transcript.length > 50 ? "..." : ""),
        description: transcript,
        voiceTranscript: transcript,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      };
      
      const success = await onAddReminder(basicReminder);
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setError("Failed to create reminder from voice note. Please try again.");
      console.error("Voice note processing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Reminder</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-center p-4">
            {isRecording ? (
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-20 w-20"
                onClick={toggleRecording}
              >
                <StopCircle size={36} />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className={`rounded-full h-20 w-20 ${isRecording ? 'bg-red-500' : ''}`}
                onClick={toggleRecording}
                disabled={isProcessing}
              >
                <Mic size={36} className={isRecording ? "animate-pulse" : ""} />
              </Button>
            )}
          </div>
          
          {transcript && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">{transcript}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <p className="text-center text-sm text-muted-foreground">
            {isRecording
              ? "Recording... Speak clearly and describe your reminder"
              : transcript
              ? "Review your voice transcription above"
              : "Tap the microphone to start recording"}
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          {transcript && (
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Reminder
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceNoteDialog;
