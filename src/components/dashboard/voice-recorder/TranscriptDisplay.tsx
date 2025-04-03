
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript: string;
}

const TranscriptDisplay = ({ transcript, interimTranscript }: TranscriptDisplayProps) => {
  // Show nothing if no transcript at all
  if (!transcript && !interimTranscript) {
    return null;
  }
  
  return (
    <div className="border rounded-md p-3 bg-slate-50">
      <h3 className="font-medium mb-2 text-sm">Your voice input:</h3>
      <ScrollArea className="h-[100px] overflow-y-auto">
        <div className="whitespace-pre-wrap overflow-hidden">
          {transcript ? (
            <p>{transcript}</p>
          ) : (
            <p className="text-muted-foreground italic">
              {interimTranscript || "Speak after pressing the record button..."}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptDisplay;
