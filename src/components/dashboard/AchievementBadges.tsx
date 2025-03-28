
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  achieved: boolean;
  progress?: number;
  maxProgress?: number;
}

const AchievementBadges = () => {
  // Mock data - in a real app, this would come from useAchievements hook
  const badges: Badge[] = [
    {
      id: "1",
      name: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      icon: "🌅",
      achieved: true
    },
    {
      id: "2",
      name: "Perfect Week",
      description: "Complete all planned tasks for a week",
      icon: "🏆",
      achieved: false,
      progress: 5,
      maxProgress: 7
    },
    {
      id: "3",
      name: "Voice Master",
      description: "Record 10 voice notes",
      icon: "🎤",
      achieved: false,
      progress: 3,
      maxProgress: 10
    },
    {
      id: "4",
      name: "Organized Teacher",
      description: "Create 20 reminders",
      icon: "📝",
      achieved: true
    }
  ];
  
  const achievedBadges = badges.filter(badge => badge.achieved);
  const inProgressBadges = badges.filter(badge => !badge.achieved);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievedBadges.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Earned</h3>
            <div className="flex flex-wrap gap-3">
              {achievedBadges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center">
                  <div className="text-2xl bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mb-1">
                    {badge.icon}
                  </div>
                  <span className="text-xs font-medium">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {inProgressBadges.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">In Progress</h3>
            <div className="space-y-3">
              {inProgressBadges.map(badge => (
                <div key={badge.id} className="flex items-start gap-3">
                  <div className="text-xl opacity-50">{badge.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{badge.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">{badge.description}</div>
                    {badge.progress !== undefined && badge.maxProgress !== undefined && (
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;
