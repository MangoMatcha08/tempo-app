
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Hammer, RefreshCw } from 'lucide-react';
import { testingUtils, resetCapabilitiesCache } from '@/utils/platformCapabilities';
import { usePlatformCapabilities } from '@/hooks/usePlatformCapabilities';

/**
 * Platform Simulator Component
 * 
 * Development-only component for simulating different platform environments
 * Especially useful for testing iOS-specific behaviors
 */
const PlatformSimulator: React.FC = () => {
  // Only available in development
  if (process.env.NODE_ENV === 'production' || !testingUtils) {
    return null;
  }
  
  const capabilities = usePlatformCapabilities();
  const [iosVersion, setIosVersion] = useState<number>(16.4);
  const [isPwa, setIsPwa] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Apply simulation
  const applySimulation = () => {
    testingUtils.simulateIOS(iosVersion, isPwa);
    setIsSimulating(true);
    capabilities.refreshCapabilities(true);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    testingUtils.resetSimulation();
    setIsSimulating(false);
    capabilities.refreshCapabilities(true);
  };
  
  return (
    <Card className="max-w-md mx-auto border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            Platform Simulator
          </CardTitle>
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">iOS Version</span>
            <span className="text-sm text-muted-foreground">{iosVersion.toFixed(1)}</span>
          </div>
          <Slider
            value={[iosVersion]}
            min={14}
            max={17}
            step={0.1}
            onValueChange={(values) => setIosVersion(values[0])}
            disabled={isSimulating}
          />
          <div className="flex text-xs justify-between text-muted-foreground">
            <span>14.0</span>
            <span>15.0</span>
            <span>16.0</span>
            <span>17.0</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">
              PWA Mode
            </label>
            <p className="text-xs text-muted-foreground">
              Simulate installed as PWA
            </p>
          </div>
          <Switch
            checked={isPwa}
            onCheckedChange={setIsPwa}
            disabled={isSimulating}
          />
        </div>
        
        <div className="pt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Current environment:</span>
          </div>
          <div className="ml-5 mt-1">
            {capabilities.isIOS ? (
              <span>
                iOS {capabilities.iosVersion?.toFixed(1)} 
                {capabilities.isPwa ? ' (PWA)' : ' (Browser)'}
              </span>
            ) : (
              <span>Non-iOS Device</span>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 justify-between pt-0">
        {!isSimulating ? (
          <Button 
            onClick={applySimulation} 
            size="sm" 
            variant="default"
            className="w-full"
          >
            Simulate iOS
          </Button>
        ) : (
          <Button 
            onClick={resetSimulation} 
            size="sm" 
            variant="outline" 
            className="w-full flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlatformSimulator;
