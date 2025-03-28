
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
import { Mic, Square, Pause, Play } from "lucide-react";

interface VoiceRecorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceRecorderModal = ({ open, onOpenChange }: VoiceRecorderModalProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [title, setTitle] = useState("");
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsRecording(false);
      setRecordingTime(0);
      setTitle("");
      setHasRecording(false);
      setIsPlaying(false);
    }
  }, [open]);
  
  // Handle recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setHasRecording(true);
      // In a real app: Stop actual recording
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      setHasRecording(false);
      // In a real app: Start actual recording
    }
  };
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // In a real app: Play/pause the recording
  };
  
  const handleSave = () => {
    // In a real app, this would call a function from useVoiceRecorder
    console.log("Saving voice note:", { title, duration: recordingTime });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
          
          <div className="flex flex-col items-center justify-center border rounded-md p-6">
            <div className="text-3xl font-mono mb-4">
              {formatTime(recordingTime)}
            </div>
            
            <div className="flex items-center gap-4">
              {!hasRecording ? (
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  className="rounded-full h-14 w-14 p-0"
                >
                  {isRecording ? (
                    <Square className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={togglePlayback}
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 p-0"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={toggleRecording}
                    variant="destructive"
                    size="icon"
                    className="rounded-full h-10 w-10 p-0"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            
            {isRecording && (
              <p className="text-xs text-muted-foreground mt-4 animate-pulse">
                Recording...
              </p>
            )}
          </div>
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
            disabled={!hasRecording || !title}
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorderModal;
