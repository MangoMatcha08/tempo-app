
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ProgressVisualization = () => {
  // Mock data - in a real app, this would come from useUserStats hook
  const stats = {
    todayCompletedTasks: 3,
    todayTotalTasks: 5,
    weekCompletedTasks: 23,
    weekTotalTasks: 35,
    currentStreak: 7,
    bestStreak: 12
  };
  
  const todayProgress = Math.round((stats.todayCompletedTasks / stats.todayTotalTasks) * 100);

  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <h3 className="font-medium text-base">Today's Progress</h3>
        
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>{stats.todayCompletedTasks} of {stats.todayTotalTasks} tasks completed</span>
            <span>{todayProgress}%</span>
          </div>
          <Progress value={todayProgress} className="h-2.5" />
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.9 6.858l4.242 4.243-7.071 7.071-4.243-4.242 7.072-7.072zm1.414-1.414l2.121-2.121 4.243 4.242-2.121 2.121-4.243-4.242zm-9.9 9.9l4.242 4.242-1.414 1.414-4.242-4.242 1.414-1.414z"/>
            </svg>
            <div>
              <div className="font-bold">{stats.currentStreak} Day Streak</div>
              <div className="text-xs text-muted-foreground">Keep it going!</div>
            </div>
          </div>
          
          <Badge className="p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
            </svg>
            Weekly Goal
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressVisualization;
