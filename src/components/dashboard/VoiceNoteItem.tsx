
import { useState } from "react";
import { Play, Pause, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // In a real app, this would handle actual audio playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="border-b border-muted">
      <div className="flex items-center p-3">
        <Button 
          size="sm" 
          variant="ghost" 
          className="rounded-full mr-3 h-9 w-9"
          onClick={togglePlayback}
        >
          {isPlaying ? 
            <Pause className="h-5 w-5" /> : 
            <Play className="h-5 w-5" />}
        </Button>
        
        <div className="flex-1">
          <div className="font-medium">{note.title}</div>
          <div className="text-xs text-muted-foreground flex items-center">
            <span>{formatDate(note.createdAt)}</span>
            <span className="mx-1">•</span>
            <span>{formatDuration(note.duration)}</span>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Options</span>
        </Button>
      </div>
    </div>
  );
};

export default VoiceNoteItem;
