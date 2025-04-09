
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface TelemetryDisplayProps {
  telemetryStats: {
    totalEvents: number;
    successRate: number;
    averageDuration: number;
    errorBreakdown: Record<string, number>;
    recentEvents: any[];
    pendingEvents: number;
  }
}

const TelemetryDisplay: React.FC<TelemetryDisplayProps> = ({ telemetryStats }) => {
  return (
    <div className="bg-slate-100 p-3 rounded-md text-xs space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-medium">Push Notification Telemetry</span>
        <Badge variant="outline" className="text-[10px]">Diagnostic</Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Events Recorded:</span>
          <span>{telemetryStats.totalEvents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Success Rate:</span>
          <span>{(telemetryStats.successRate * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pending Events:</span>
          <span>{telemetryStats.pendingEvents}</span>
        </div>
        {Object.keys(telemetryStats.errorBreakdown).length > 0 && (
          <div className="pt-1">
            <span className="text-muted-foreground block mb-1">Error Breakdown:</span>
            <ul className="pl-3 space-y-1">
              {Object.entries(telemetryStats.errorBreakdown).map(([key, count]) => (
                <li key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="text-[10px] text-muted-foreground pt-1 flex items-center">
        <ExternalLink className="h-3 w-3 mr-1" />
        View debugging logs in console for more details
      </div>
    </div>
  );
};

export default TelemetryDisplay;
