
import React from 'react';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import FeatureFlagPanel from './FeatureFlagPanel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Code, Database, Flag, Settings, BugPlay } from 'lucide-react';

interface DeveloperPanelProps {
  className?: string;
}

const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ className }) => {
  const { devMode, toggleDevMode } = useFeatureFlags();
  
  // Only show in development environment or when devMode is enabled
  if (process.env.NODE_ENV !== 'development' && !devMode) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="icon">
            <BugPlay className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Developer Tools</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <FeatureFlagPanel triggerClassName="w-full justify-start" />
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => console.log('Clear local storage')}>
              <Database className="mr-2 h-4 w-4" />
              <span>Clear Local Storage</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={toggleDevMode}>
              <Code className="mr-2 h-4 w-4" />
              <span>
                {devMode ? 'Disable' : 'Enable'} Dev Mode
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DeveloperPanel;
