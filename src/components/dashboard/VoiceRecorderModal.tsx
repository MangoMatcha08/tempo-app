
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Mic, Square, Pause, Play, Loader2 } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import { processVoiceInput } from "@/services/nlpService";
import { createReminder } from "@/utils/reminderUtils";
import { useToast } from "@/hooks/use-toast";
import { Reminder } from "@/types/reminderTypes";

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceRecorderModal = ({ open, onOpenChange }: VoiceRecorderModalProps) => {
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setTranscript("");
      setIsProcessing(false);
    }
  }, [open]);
  
  const handleTranscriptComplete = (text: string) => {
    setTranscript(text);
    setIsProcessing(true);
    
    try {
      // Process the transcript with NLP
      const result = processVoiceInput(text);
      
      // Set the title from the processed result
      setTitle(result.reminder.title);
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
  
  const handleSave = () => {
    if (!transcript || !title) return;
    
    try {
      // Process the voice input to create a reminder
      const result = processVoiceInput(transcript);
      result.reminder.title = title; // Use the user-edited title
      
      const newReminder = createReminder(result.reminder);
      
      // Add to reminders
      // In real app, this would use a hook or context to add the reminder
      console.log("Created voice reminder:", newReminder);
      
      toast({
        title: "Reminder Created",
        description: "Your voice reminder has been created successfully."
      });
      
      // Reset form and close modal
      setTitle("");
      setTranscript("");
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Voice Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your note a title"
            />
          </div>
          
          <VoiceRecorder onTranscriptComplete={handleTranscriptComplete} />
          
          {isProcessing && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>Processing your input...</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={!transcript || !title}
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
