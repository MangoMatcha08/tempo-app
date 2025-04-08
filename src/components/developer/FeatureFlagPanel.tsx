
import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { FeatureFlags, isBooleanFeature } from '@/types/notifications/featureFlags';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Cog, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Feature descriptions for the UI
const FEATURE_DESCRIPTIONS: Record<keyof FeatureFlags, string> = {
  HISTORY_ENABLED: "Store notification history for later viewing",
  QUIET_HOURS_ENABLED: "Allow users to set quiet hours for notifications",
  BULK_ACTIONS_ENABLED: "Enable bulk actions for notifications",
  NOTIFICATION_GROUPING: "Group similar notifications together",
  AUTO_CLEANUP: "Automatically clean up old notifications",
  VIRTUALIZED_LISTS: "Use virtualized lists for better performance with large datasets",
  PAGINATED_LOADING: "Load notifications in pages rather than all at once",
  ADVANCED_CACHE: "Use advanced caching strategies for offline access",
  INFINITE_SCROLL: "Enable infinite scrolling for notifications",
  DEV_MODE: "Enable developer tools and additional logging",
  VERBOSE_LOGGING: "Log detailed information to the console",
  NOTIFICATIONS_PAGE_SIZE: "Default number of notifications to show per page",
  SMALL_PAGE_SIZE: "Small page size for limited views",
  LARGE_PAGE_SIZE: "Large page size for expanded views"
};

// Group categories for organization
const FEATURE_GROUPS = {
  "Core Features": [
    "HISTORY_ENABLED",
    "QUIET_HOURS_ENABLED", 
    "BULK_ACTIONS_ENABLED",
    "NOTIFICATION_GROUPING"
  ],
  "Performance Optimizations": [
    "VIRTUALIZED_LISTS",
    "PAGINATED_LOADING", 
    "ADVANCED_CACHE",
    "AUTO_CLEANUP",
    "INFINITE_SCROLL"
  ],
  "Page Configurations": [
    "NOTIFICATIONS_PAGE_SIZE",
    "SMALL_PAGE_SIZE",
    "LARGE_PAGE_SIZE"
  ],
  "Developer Tools": [
    "DEV_MODE",
    "VERBOSE_LOGGING"
  ]
};

interface FeatureFlagPanelProps {
  className?: string;
  triggerClassName?: string;
}

const FeatureFlagPanel: React.FC<FeatureFlagPanelProps> = ({ 
  className,
  triggerClassName
}) => {
  const { flags, setFlag, resetFlags, devMode } = useFeatureFlags();

  // Handle toggle for boolean feature flags
  const handleToggle = (flagName: keyof FeatureFlags) => {
    if (isBooleanFeature(flagName)) {
      setFlag(flagName, !flags[flagName]);
    }
  };

  // Handle numeric input change
  const handleNumericChange = (flagName: keyof FeatureFlags, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setFlag(flagName, numValue);
    }
  };

  // Reset all flags to defaults
  const handleReset = () => {
    if (window.confirm('Reset all feature flags to default values?')) {
      resetFlags();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={triggerClassName}
        >
          <Flag className="h-4 w-4 mr-2" />
          Feature Flags
          {devMode && (
            <Badge variant="default" className="ml-2">DEV</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className={`sm:max-w-md ${className}`}>
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Flag className="h-5 w-5 mr-2" />
            Feature Flags
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-140px)] pr-4 my-4">
          <div className="space-y-6">
            {Object.entries(FEATURE_GROUPS).map(([groupName, featureKeys]) => (
              <Card key={groupName}>
                <CardHeader className="pb-3">
                  <CardTitle>{groupName}</CardTitle>
                  <CardDescription>
                    {groupName === "Performance Optimizations" 
                      ? "Improve application performance and resource usage"
                      : groupName === "Developer Tools"
                      ? "Tools for development and debugging"
                      : groupName === "Page Configurations"
                      ? "Configure page sizes and display settings"
                      : "Core notification system functionality"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {featureKeys.map(key => {
                      const flagKey = key as keyof FeatureFlags;
                      const isBoolean = isBooleanFeature(flagKey);
                      
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-medium">{key.replace(/\_/g, ' ')}</div>
                            <div className="text-sm text-muted-foreground">
                              {FEATURE_DESCRIPTIONS[flagKey]}
                            </div>
                          </div>
                          {isBoolean ? (
                            <Switch 
                              checked={!!flags[flagKey]} 
                              onCheckedChange={() => handleToggle(flagKey)} 
                            />
                          ) : (
                            <Input 
                              type="number"
                              min="1"
                              value={flags[flagKey] as number}
                              onChange={(e) => handleNumericChange(flagKey, e.target.value)}
                              className="w-20"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>Feature flags are stored in your browser. Disabling critical features may cause unexpected behavior.</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <SheetFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            Reset to defaults
          </Button>
          <SheetClose asChild>
            <Button>Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FeatureFlagPanel;
