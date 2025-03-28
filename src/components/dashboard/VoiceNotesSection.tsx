
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import VoiceNoteItem from "./VoiceNoteItem";

const VoiceNotesSection = () => {
  // Mock data - in a real app, this would come from useVoiceNotes hook
  const voiceNotes = [
    {
      id: "1",
      title: "Lesson Plan Ideas",
      duration: 95, // seconds
      createdAt: new Date(2025, 2, 28), // Mar 28, 2025
      transcription: "Incorporate more interactive elements in the geometry lesson. Use the 3D models from cabinet B."
    },
    {
      id: "2",
      title: "Student Assessment Notes",
      duration: 126, // seconds
      createdAt: new Date(2025, 2, 26), // Mar 26, 2025
      transcription: "Sarah has shown improvement in algebra. John needs additional help with fractions."
    },
    {
      id: "3",
      title: "Lab Preparation Checklist",
      duration: 77, // seconds
      createdAt: new Date(2025, 2, 24), // Mar 24, 2025
      transcription: "Need to order more test tubes. Check safety goggles inventory before Friday's experiment."
    }
  ];

  return (
    <div className="mt-6 md:mt-0">
      <h2 className="text-xl font-bold mb-3">Recent Voice Notes</h2>
      
      <Card>
        <CardContent className="p-0">
          {voiceNotes.length > 0 ? (
            <>
              {voiceNotes.map((note) => (
                <VoiceNoteItem key={note.id} note={note} />
              ))}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No voice notes yet. Click "Voice Note" to create one.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceNotesSection;
