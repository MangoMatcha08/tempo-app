
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isPwaMode, isIOSDevice, isMobileDevice } from '@/hooks/speech-recognition/utils';

const PWATestComponent = () => {
  const [isPWA, setIsPWA] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    setIsPWA(isPwaMode());
    setIsIOS(isIOSDevice());
    setIsMobile(isMobileDevice());
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>PWA Environment Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p>Running as PWA: <strong>{isPWA ? 'Yes' : 'No'}</strong></p>
            <p>iOS Device: <strong>{isIOS ? 'Yes' : 'No'}</strong></p>
            <p>Mobile Device: <strong>{isMobile ? 'Yes' : 'No'}</strong></p>
          </div>
          
          <Button
            onClick={() => {
              setIsPWA(isPwaMode());
              setIsIOS(isIOSDevice());
              setIsMobile(isMobileDevice());
            }}
          >
            Refresh Detection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWATestComponent;
