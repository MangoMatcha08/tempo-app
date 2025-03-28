
import { useState } from "react";
import { Play, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VoiceNote {
  id: string;
  title: string;
  duration: number; // in seconds
  createdAt: Date;
  transcription: string;
}

interface VoiceNoteItemProps {
  note: VoiceNote;
}

const VoiceNoteItem = ({ note }: VoiceNoteItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  // In a real app, this would handle actual audio playback
  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // In a real implementation: pause the audio
    } else {
      setIsPlaying(true);
      // In a real implementation: play the audio
      simulatePlayback();
    }
  };
  
  // This simulates audio playback for demo purposes
  const simulatePlayback = () => {
    let currentProgress = 0;
    setProgress(0);
    
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsPlaying(false);
        setProgress(0);
      }
    }, note.duration * 10); // Speed up simulation
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  };

  return (
    <div className="bg-secondary/20 rounded-md p-4">
      <div className="flex justify-between mb-2">
        <h3 className="font-medium">{note.title}</h3>
        <span className="text-xs text-muted-foreground">
          {formatDate(note.createdAt)}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-8 w-8 p-0" 
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>
        
        <Progress value={progress} className="flex-1 h-2" />
        
        <span className="text-xs text-muted-foreground min-w-[40px] text-right">
          {formatDuration(note.duration)}
        </span>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <Button
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 px-2" 
          onClick={() => setShowTranscript(!showTranscript)}
        >
          {showTranscript ? "Hide transcript" : "Show transcript"}
        </Button>
        
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
      
      {showTranscript && (
        <div className="mt-3 p-3 bg-background rounded text-sm text-muted-foreground">
          {note.transcription}
        </div>
      )}
    </div>
  );
};

export default VoiceNoteItem;
