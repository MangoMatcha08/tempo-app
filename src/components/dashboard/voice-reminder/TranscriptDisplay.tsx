
interface TranscriptDisplayProps {
  transcript: string;
}

const TranscriptDisplay = ({ transcript }: TranscriptDisplayProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Original Input</label>
      <div className="p-3 bg-muted/30 rounded-md text-sm italic">
        {transcript}
      </div>
    </div>
  );
};

export default TranscriptDisplay;
