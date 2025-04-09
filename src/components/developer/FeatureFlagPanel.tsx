import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Feature flag descriptions - adding the missing entries
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Core notification features
  HISTORY_ENABLED: "Enable notification history tracking",
  QUIET_HOURS_ENABLED: "Enable quiet hours mode",
  BULK_ACTIONS_ENABLED: "Enable bulk actions for notifications",
  NOTIFICATION_GROUPING: "Group similar notifications together",
  
  // Performance & reliability features
  AUTO_CLEANUP: "Automatically clean up old notifications",
  VIRTUALIZED_LISTS: "Use virtualized lists for performance",
  PAGINATED_LOADING: "Enable paginated loading for notifications",
  ADVANCED_CACHE: "Use advanced caching strategies",
  
  // iOS-specific features
  IOS_PWA_FALLBACK: "Enable fallback for iOS PWA limitations",
  IOS_PUSH_SUPPORT: "Enhanced support for iOS push notifications",
  
  // Offline & sync features
  BACKGROUND_SYNC: "Enable background syncing of data",
  OFFLINE_NOTIFICATIONS: "Enable offline notification support",
  SHOW_SYNC_NOTIFICATIONS: "Show notifications for sync events",
  
  // Developer features
  DEV_MODE: "Enable developer mode",
  VERBOSE_LOGGING: "Enable verbose logging",
  
  // Other features
  IOS_VERSION_ROLLOUT: "iOS version-based feature rollout"
};

const FeatureFlagPanel = () => {
  const { flags, setFlag, resetFlags, devMode, toggleDevMode } = useFeatureFlags();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Feature Flags
          <Button variant="secondary" size="sm" onClick={resetFlags}>Reset to Defaults</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-4">
            <Switch id="devMode" checked={devMode} onCheckedChange={toggleDevMode} />
            <Label htmlFor="devMode">Developer Mode {devMode ? 'Enabled' : 'Disabled'}</Label>
          </div>
        </div>
        
        <div className="space-y-4">
          {Object.keys(flags).map((flag) => (
            <div key={flag} className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-medium">{flag}</h3>
                <p className="text-sm text-muted-foreground">{FEATURE_DESCRIPTIONS[flag] || "No description available"}</p>
              </div>
              <Switch
                checked={flags[flag]}
                onCheckedChange={(checked) => setFlag(flag, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureFlagPanel;
