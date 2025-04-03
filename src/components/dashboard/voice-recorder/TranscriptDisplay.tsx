
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
}

const TranscriptDisplay = ({ transcript, interimTranscript }: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);
  
  // Show nothing if no transcript at all
  if (!transcript && !interimTranscript) {
    return null;
  }
  
  // Determine what to display - show both final and interim for better visibility
  const displayText = transcript 
    ? (interimTranscript ? `${transcript} ${interimTranscript}` : transcript)
    : interimTranscript;
  
  // Determine text class - only add faded style to interim text
  const textClass = !transcript && interimTranscript 
    ? "text-muted-foreground italic" 
    : "";
  
  return (
    <div className="border rounded-md p-3 bg-slate-50">
      <h3 className="font-medium mb-2 text-sm">Your voice input:</h3>
      <ScrollArea className="h-[100px] overflow-y-auto" ref={scrollRef}>
        <div className="whitespace-pre-wrap overflow-hidden">
          {displayText ? (
            <p className={textClass}>{displayText}</p>
          ) : (
            <p className="text-muted-foreground italic">
              Speak after pressing the record button...
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptDisplay;
