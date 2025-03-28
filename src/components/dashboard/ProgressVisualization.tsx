
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ProgressVisualization = () => {
  // Mock data - in a real app, this would come from useUserStats hook
  const stats = {
    todayCompletedTasks: 5,
    todayTotalTasks: 8,
    weekCompletedTasks: 23,
    weekTotalTasks: 35,
    currentStreak: 4,
    bestStreak: 12
  };
  
  const todayProgress = Math.round((stats.todayCompletedTasks / stats.todayTotalTasks) * 100);
  const weekProgress = Math.round((stats.weekCompletedTasks / stats.weekTotalTasks) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Today's Tasks</span>
            <span className="font-medium">{stats.todayCompletedTasks}/{stats.todayTotalTasks}</span>
          </div>
          <Progress value={todayProgress} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>This Week</span>
            <span className="font-medium">{stats.weekCompletedTasks}/{stats.weekTotalTasks}</span>
          </div>
          <Progress value={weekProgress} className="h-2" />
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
              <div className="text-2xl font-bold">{stats.currentStreak} days</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Best Streak</div>
              <div className="text-2xl font-bold">{stats.bestStreak} days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressVisualization;
