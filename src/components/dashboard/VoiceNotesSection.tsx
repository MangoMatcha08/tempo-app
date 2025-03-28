
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import VoiceNoteItem from "./VoiceNoteItem";

const VoiceNotesSection = () => {
  // Mock data - in a real app, this would come from useVoiceNotes hook
  const voiceNotes = [
    {
      id: "1",
      title: "Feedback for 3rd period presentations",
      duration: 45, // seconds
      createdAt: new Date(new Date().getTime() - 3600000), // 1 hour ago
      transcription: "Remember to provide detailed feedback for Sarah's project on renewable energy. Her research was thorough but presentation needs work."
    },
    {
      id: "2",
      title: "Math lesson plan ideas",
      duration: 32, // seconds
      createdAt: new Date(new Date().getTime() - 86400000), // 1 day ago
      transcription: "Try incorporating the group problem-solving activity for the geometry unit. Use the manipulatives from cabinet B."
    },
    {
      id: "3",
      title: "Science lab preparation",
      duration: 68, // seconds
      createdAt: new Date(new Date().getTime() - 172800000), // 2 days ago
      transcription: "Need to prep materials for the chemistry experiment. Check inventory of test tubes and safety goggles before Friday."
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {voiceNotes.length > 0 ? (
          <div className="space-y-4">
            {voiceNotes.map((note) => (
              <VoiceNoteItem key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No voice notes yet. Click "Voice Note" to create one.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceNotesSection;
